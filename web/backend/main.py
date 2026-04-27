import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path

import numpy as np
from PIL import Image as PILImage
from PIL import UnidentifiedImageError
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="SkyMatrix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BINARY = PROJECT_ROOT / "build" / "skymatrix"
UPLOAD_DIR = PROJECT_ROOT / "web" / "backend" / "uploads"
OUTPUT_DIR = PROJECT_ROOT / "web" / "backend" / "outputs"
TEST_IMAGES_DIR = PROJECT_ROOT / "test_images"
SUPPORTED_IMAGE_EXTS = {
    ".pgm", ".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"
}

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Serve output images as static files
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok", "binary_exists": BINARY.exists()}


@app.get("/api/test-images")
def list_test_images():
    """List available test images."""
    images = []
    if TEST_IMAGES_DIR.exists():
        for f in sorted(TEST_IMAGES_DIR.iterdir()):
            if not f.is_file() or f.suffix.lower() not in SUPPORTED_IMAGE_EXTS:
                continue
            try:
                with PILImage.open(f) as img:
                    img.verify()
                images.append({"name": f.name, "size": f.stat().st_size})
            except Exception:
                continue
    return {"images": images}


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(None),
    test_image: str = Form(None),
    block_size: int = Form(16),
    z_threshold: float = Form(2.0),
    top_k: int = Form(10),
    variance_threshold: float = Form(100.0),
):
    """Run SkyMatrix analysis on an uploaded or test image."""
    job_id = str(uuid.uuid4())[:8]

    # Determine input path
    if file and file.filename:
        raw_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
        content = await file.read()
        raw_path.write_bytes(content)

        # Auto-convert non-PGM images (PNG, JPG, TIFF, BMP, etc.) to PGM
        suffix = raw_path.suffix.lower()
        if suffix != ".pgm":
            input_path = UPLOAD_DIR / f"{job_id}_converted.pgm"
            try:
                pil_img = PILImage.open(raw_path)

                if pil_img.mode in ("RGB", "RGBA"):
                    # Vegetation-enhanced grayscale conversion:
                    # Emphasize green channel (vegetation appears bright green in satellite images)
                    # Standard: 0.299R + 0.587G + 0.114B
                    # Enhanced: 0.15R + 0.70G + 0.15B (boosts forest/vegetation contrast)
                    if pil_img.mode == "RGBA":
                        pil_img = pil_img.convert("RGB")
                    arr = np.array(pil_img, dtype=np.float32)
                    gray = (0.15 * arr[:,:,0] + 0.70 * arr[:,:,1] + 0.15 * arr[:,:,2])
                    gray = np.clip(gray, 0, 255).astype(np.uint8)
                    pil_img = PILImage.fromarray(gray, mode="L")
                else:
                    pil_img = pil_img.convert("L")

                # Resize large images to max 1024 on longest side for fast processing
                max_dim = max(pil_img.size)
                if max_dim > 1024:
                    scale = 1024 / max_dim
                    new_size = (int(pil_img.size[0] * scale), int(pil_img.size[1] * scale))
                    pil_img = pil_img.resize(new_size, PILImage.LANCZOS)

                # Apply contrast enhancement (histogram equalization)
                # This spreads pixel values across the full 0-255 range
                # making subtle differences in real images much more visible
                from PIL import ImageOps
                pil_img = ImageOps.equalize(pil_img)

                pil_img.save(str(input_path), format="PPM")
            except UnidentifiedImageError:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Uploaded file is not a valid image: {file.filename}"},
                )
            except Exception as e:
                return JSONResponse(status_code=400, content={"error": f"Cannot convert image: {e}"})
        else:
            input_path = raw_path
    elif test_image:
        input_path = TEST_IMAGES_DIR / test_image
        if not input_path.exists():
            return JSONResponse(status_code=404, content={"error": f"Test image not found: {test_image}"})
        try:
            with PILImage.open(input_path) as img:
                img.verify()
        except UnidentifiedImageError:
            return JSONResponse(
                status_code=400,
                content={"error": f"Invalid test image: {test_image}"},
            )
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Invalid test image: {e}"})
    else:
        return JSONResponse(status_code=400, content={"error": "No image provided"})

    output_pgm = OUTPUT_DIR / f"{job_id}_output.pgm"
    output_json = OUTPUT_DIR / f"{job_id}_output.json"

    # Run the C++ binary
    cmd = [
        str(BINARY),
        "--input", str(input_path),
        "--output", str(output_pgm),
        "--json", str(output_json),
        "--block-size", str(block_size),
        "--z-threshold", str(z_threshold),
        "--top-k", str(top_k),
        "--variance-thresh", str(variance_threshold),
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if proc.returncode != 0:
            return JSONResponse(status_code=500, content={
                "error": "Analysis failed",
                "stderr": proc.stderr,
                "stdout": proc.stdout,
            })
    except subprocess.TimeoutExpired:
        return JSONResponse(status_code=500, content={"error": "Analysis timed out"})

    # Read JSON results
    if not output_json.exists():
        return JSONResponse(status_code=500, content={"error": "No output JSON generated"})

    with open(output_json) as f:
        results = json.load(f)

    # --- RULE-BASED ALGORITHMIC CLASSIFICATION ---
    try:
        # Load the auto-converted PGM image (or original if already PGM) into numpy array
        img_arr = np.array(PILImage.open(input_path).convert("L"))
        
        for r in results.get("top_k_regions", []):
            x = r["x"]
            y = r["y"]
            w = r.get("width", r.get("size", 0))
            h = r.get("height", r.get("size", 0))
            
            # Extract Region of Interest (Crop)
            x0, y0 = max(0, x), max(0, y)
            x1, y1 = min(img_arr.shape[1], x + w), min(img_arr.shape[0], y + h)
            crop = img_arr[y0:y1, x0:x1]
            
            # Rule-based calculation (No CNN)
            if crop.size > 0:
                var = np.var(crop)
                mean = np.mean(crop)
                
                # Simple statistical thresholds
                if mean < 60 and var < 300:
                    label = "Water/Flood"
                elif mean > 140 and var > 800:
                    label = "Urban Specular"
                elif var > 1200:
                    label = "Wildfire/Burn"
                elif mean > 180:
                    label = "Cloud/Snow"
                else:
                    label = "Forest Anomaly"
            else:
                label = "Unknown Edge"
                
            r["classification"] = label
    except Exception as e:
        print(f"Classification error: {e}")
    # ---------------------------------------------

    # Add image URLs to response
    results["job_id"] = job_id
    results["input_image_url"] = f"/uploads/{input_path.name}" if file and file.filename else f"/api/test-image-file/{test_image}"
    results["output_image_url"] = f"/outputs/{output_pgm.name}"
    results["console_output"] = proc.stdout

    return results


@app.get("/api/test-image-file/{name}")
def serve_test_image(name: str):
    """Serve a test image file."""
    path = TEST_IMAGES_DIR / name
    if not path.exists():
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return FileResponse(str(path), media_type="application/octet-stream")


# Serve frontend static files (built React app) — must be last
FRONTEND_DIR = PROJECT_ROOT / "web" / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
