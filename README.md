<p align="center">
  <img src="https://img.shields.io/badge/C%2B%2B-17-blue?style=for-the-badge&logo=cplusplus" alt="C++17" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# SkyMatrix — Hierarchical Satellite Image Analytics Engine

**SkyMatrix** is a high-performance satellite image analysis platform that detects anomalous regions in grayscale imagery using a pipeline of classical algorithms. It combines a **C++17 computational engine** with a **React + FastAPI web interface**, enabling real-time spatial anomaly detection with interactive visualization.

The system is purpose-built for satellite and aerial imagery — deforestation patches, urban heat islands, flood zones, burn scars — any scenario where visually distinct regions need to be automatically identified and ranked against a statistical baseline.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [How It Works — The Analysis Pipeline](#how-it-works--the-analysis-pipeline)
  - [Stage 1: Image Loading & Preprocessing](#stage-1-image-loading--preprocessing)
  - [Stage 2: 2D Prefix Sum (Dynamic Programming)](#stage-2-2d-prefix-sum-dynamic-programming)
  - [Stage 3: QuadTree Decomposition (Divide & Conquer)](#stage-3-quadtree-decomposition-divide--conquer)
  - [Stage 4: Z-Score Anomaly Detection](#stage-4-z-score-anomaly-detection)
  - [Stage 5: Connected Component Detection (Union-Find)](#stage-5-connected-component-detection-union-find)
  - [Stage 6: Top-K Selection (Min-Heap)](#stage-6-top-k-selection-min-heap)
- [Algorithm Complexity Analysis](#algorithm-complexity-analysis)
- [Frontend — Interactive Visualization](#frontend--interactive-visualization)
- [Backend — FastAPI Server](#backend--fastapi-server)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Docker (Recommended)](#docker-recommended)
  - [Manual Setup](#manual-setup)
- [CLI Usage](#cli-usage)
- [Configuration Parameters](#configuration-parameters)

---

## Architecture Overview

SkyMatrix follows a three-tier architecture where the heavy computation is offloaded to a compiled C++ binary, orchestrated by a Python backend, and visualized through a React frontend.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Upload   │  │ Canvas-based │  │   Results Dashboard        │ │
│  │  & Config │  │ Image Viewer │  │  Stats · Timing · Regions  │ │
│  └─────┬─────┘  └──────┬───────┘  └────────────┬───────────────┘ │
│        │               │                        │                │
│        └───────────────┼────────────────────────┘                │
│                        │ HTTP POST /api/analyze                  │
├────────────────────────┼─────────────────────────────────────────┤
│                   BACKEND (FastAPI)                               │
│  ┌─────────────────────┼───────────────────────────────────┐     │
│  │  Image Preprocessing │  Format Conversion · Scaling     │     │
│  │  (Pillow + NumPy)    │  Vegetation Grayscale · Equalize │     │
│  └─────────────────────┬───────────────────────────────────┘     │
│                        │ subprocess.run()                        │
├────────────────────────┼─────────────────────────────────────────┤
│               C++ ENGINE (skymatrix binary)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Prefix   │→│ QuadTree │→│ Anomaly  │→│ Union    │           │
│  │ Sum (DP) │ │  (D&C)   │ │ (Z-Score)│ │ Find+K  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│           Output: JSON report + highlighted PGM image            │
└──────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User uploads an image (PNG, JPG, TIFF, BMP, or PGM) or selects a test image
2. FastAPI preprocesses: converts to grayscale with vegetation-enhanced weights, scales, and equalizes
3. The C++ binary executes the 6-stage pipeline in milliseconds
4. Results (JSON + annotated image) are returned to the frontend
5. React renders the image on a canvas with interactive overlays, statistics, and timing charts

---

## How It Works — The Analysis Pipeline

The core engine executes a sequential pipeline of six stages. Each stage feeds its output into the next, transforming raw pixel data into ranked anomalous regions.

### Stage 1: Image Loading & Preprocessing

**Purpose:** Prepare the input image for analysis.

**Backend Preprocessing (Python):**

When a non-PGM image is uploaded, the backend applies three preprocessing steps before passing it to the C++ engine:

1. **Vegetation-Enhanced Grayscale Conversion**

   Standard grayscale: `0.299R + 0.587G + 0.114B`
   SkyMatrix enhanced: **`0.15R + 0.70G + 0.15B`**

   By heavily weighting the green channel (70%), vegetation appears significantly brighter than non-vegetated areas. This amplifies the contrast between forested regions and bare soil, water, or urban zones — making anomalies in satellite imagery far more detectable.

2. **Downscaling** — Images larger than 1024px on their longest side are resized using Lanczos interpolation to keep processing fast while preserving detail.

3. **Histogram Equalization** — Spreads pixel intensities across the full 0–255 range. Real-world satellite images often have compressed dynamic range; equalization makes subtle differences visible.

**C++ Image Loading:**

The engine reads PGM format (Portable GrayMap) — both P2 (ASCII) and P5 (binary) variants. The image is stored as a 2D array of `uint8_t` pixel values.

```
File: src/image.cpp
Format: PGM (P2 ASCII / P5 Binary)
Data structure: Image { width, height, data[row][col] }
```

---

### Stage 2: 2D Prefix Sum (Dynamic Programming)

**Purpose:** Enable O(1) computation of the sum, mean, and variance of any rectangular sub-region.

**The Problem:** The QuadTree and anomaly detection stages need to compute statistics (mean and variance) for thousands of image sub-regions. Naively summing pixels for each query would be O(area) per query — far too slow.

**The Solution — Inclusion-Exclusion Principle:**

A 2D prefix sum table is built in a single O(W x H) pass. Each cell `ps[r][c]` stores the sum of all pixels in the rectangle from `(0,0)` to `(r-1, c-1)`.

```
Build recurrence (1-based indexing):
  ps[r][c] = pixel(r-1, c-1) + ps[r-1][c] + ps[r][c-1] - ps[r-1][c-1]

Region sum query (0-based [r1,c1] to [r2,c2]):
  sum = ps[r2+1][c2+1] - ps[r1][c2+1] - ps[r2+1][c1] + ps[r1][c1]
```

**Two tables are maintained:**
- `sum[r][c]` — cumulative pixel values (for mean calculation)
- `sq_sum[r][c]` — cumulative squared pixel values (for variance calculation)

**Variance via prefix sums:**
```
Var(region) = E[X^2] - (E[X])^2
            = sq_sum(region) / area  -  (sum(region) / area)^2
```

This allows the QuadTree to evaluate any block's mean and variance in **O(1)** without touching individual pixels.

```
File: src/prefix_sum.cpp
Time complexity: O(W × H) build, O(1) per query
Space complexity: O(W × H) for two 2D tables
```

---

### Stage 3: QuadTree Decomposition (Divide & Conquer)

**Purpose:** Adaptively partition the image into variable-sized blocks, spending resolution on complex areas and coarsening uniform areas.

**Why not a fixed grid?** A fixed-size grid wastes computation on uniform regions (sky, water, flat terrain) while potentially under-sampling complex boundaries. The QuadTree adapts: it keeps large blocks where variance is low and subdivides where detail exists.

**Algorithm:**

1. Determine the image's bounding power-of-2 size (e.g., a 640x480 image starts with a 1024x1024 root)
2. For each node, compute its variance using the prefix sum table (O(1))
3. **If** `variance <= variance_threshold` **OR** `size <= min_block_size` → create a **leaf** (stop subdividing)
4. **Otherwise** → split into 4 equal quadrants (NW, NE, SW, SE) and recurse

```
build_recursive(x, y, size):
    node.mean = prefix_sum.region_mean(y, x, y+size-1, x+size-1)
    node.variance = prefix_sum.region_variance(y, x, y+size-1, x+size-1)

    if size <= min_block OR variance <= threshold:
        return leaf(node)

    half = size / 2
    node.children[NW] = build_recursive(x,      y,      half)
    node.children[NE] = build_recursive(x+half, y,      half)
    node.children[SW] = build_recursive(x,      y+half, half)
    node.children[SE] = build_recursive(x+half, y+half, half)
    return node
```

**Result:** An adaptive tree where leaves represent image blocks. Uniform sky might produce a single 256x256 leaf, while a forest boundary produces many 4x4 leaves. This adaptive resolution is key to efficient anomaly detection.

```
File: src/quadtree.cpp
Time complexity: O(N) where N = number of nodes created (data-dependent)
Space complexity: O(N) nodes in the tree
```

---

### Stage 4: Z-Score Anomaly Detection

**Purpose:** Identify QuadTree leaves whose pixel statistics deviate significantly from the image's global baseline.

**Z-Score Computation:**

For each leaf node, the Z-score measures how many standard deviations the leaf's mean is from the global mean:

```
z = |leaf.mean - global_mean| / global_stddev
```

A leaf with z = 3.0 means its average brightness is 3 standard deviations away from the image average — statistically very unusual.

**Enhanced Scoring — Variance Ratio Boost:**

Pure mean-based Z-scores miss an important pattern: boundary regions (edges of deforestation, coastlines, cloud borders) have *high local variance* even if their mean is close to the global mean. SkyMatrix adds a variance-ratio boost:

```
var_ratio = leaf.variance / global_variance
combined_z = z + max(0, (var_ratio - 1.5) * 0.3)
```

If a region's local variance is more than 1.5x the global variance, its Z-score is boosted proportionally. This catches transitional zones that pure mean-based detection would miss.

**Edge Artifact Filtering:**

QuadTree nodes at image boundaries may be partially outside the image (due to power-of-2 rounding). Nodes with less than 90% pixel coverage are discarded to prevent false positives from padding artifacts.

```
coverage = (clipped_width × clipped_height) / (node.size²)
if coverage < 0.9: skip
```

```
File: src/anomaly.cpp
Time complexity: O(L) where L = number of QuadTree leaves
Space complexity: O(A) where A = number of anomalies detected
```

---

### Stage 5: Connected Component Detection (Union-Find)

**Purpose:** Group adjacent anomalous regions into coherent spatial clusters.

**The Problem:** Individual QuadTree leaves are small blocks. A deforested patch might produce 20 adjacent anomalous leaves. Without grouping, the user sees 20 disconnected blocks instead of one meaningful region.

**Solution — Disjoint Set Union (Union-Find):**

1. **Initialize:** Each anomaly is its own component
2. **Pairwise adjacency test:** Two regions are adjacent if their bounding boxes touch or overlap:
   ```
   adjacent(A, B) = (A.left <= B.right AND B.left <= A.right)
                  AND (A.top <= B.bottom AND B.top <= A.bottom)
   ```
3. **Union:** Merge adjacent anomalies into the same component using Union-Find with:
   - **Path compression** in `find()` — flattens the tree for near-O(1) lookups
   - **Union by rank** in `unite()` — keeps the tree balanced
4. **Bounding box computation:** For each component, compute the tightest axis-aligned bounding box enclosing all its member regions
5. **Scoring:** Each component's score = the maximum Z-score among its member regions

```
UnionFind operations:
  find(x):  if parent[x] != x → parent[x] = find(parent[x])  // path compression
             return parent[x]

  unite(x, y):  attach shorter tree under taller tree          // union by rank
```

```
File: src/union_find.cpp, src/connected_comp.cpp
Time complexity: O(A² × α(A)) where A = anomaly count, α = inverse Ackermann
Space complexity: O(A) for the Union-Find structure
```

---

### Stage 6: Top-K Selection (Min-Heap)

**Purpose:** Select the K most significant components and their regions from all detected anomalies.

**Algorithm:**

Components are sorted by their `max_score` (the highest Z-score among their member regions) in descending order. The top K components are selected, and all their constituent regions are collected and sorted by Z-score.

The underlying `select_top_k` function uses a **min-heap** of size K:

```
for each anomaly in all_anomalies:
    if heap.size < K:
        heap.push(anomaly)
    else if anomaly.z_score > heap.top().z_score:
        heap.pop()
        heap.push(anomaly)
```

The heap's top always holds the smallest Z-score among the current top K. Any anomaly with a higher score displaces it. This is O(n log k) — far more efficient than sorting all anomalies when K << n.

```
File: src/top_k.cpp
Time complexity: O(A log K) where A = total anomalies, K = desired count
Space complexity: O(K) for the heap
```

---

## Algorithm Complexity Analysis

| Stage | Algorithm | Time Complexity | Space Complexity |
|---|---|---|---|
| Image Load | File I/O | O(W × H) | O(W × H) |
| Prefix Sum | 2D Dynamic Programming | O(W × H) | O(W × H) |
| QuadTree | Divide & Conquer | O(N) adaptive | O(N) nodes |
| Anomaly Detection | Z-Score + Variance Boost | O(L) leaves | O(A) anomalies |
| Connected Components | Union-Find (DSU) | O(A² × α(A)) | O(A) |
| Top-K Selection | Min-Heap | O(A log K) | O(K) |

Where: W = width, H = height, N = QuadTree nodes, L = leaf nodes, A = anomaly count, K = top-K parameter, α = inverse Ackermann function (effectively constant).

---

## Frontend — Interactive Visualization

The React frontend provides a three-panel layout for a complete analysis workflow:

### Left Sidebar — Upload & Configuration
- **Drag-and-drop file upload** accepting PNG, JPG, TIFF, BMP, and PGM formats
- **Test image library** with pre-loaded satellite samples for quick experimentation
- **Real-time parameter sliders:**
  - **Block Size** (4–128px): Minimum QuadTree leaf size — smaller = finer resolution
  - **Z-Threshold** (0.1–5.0σ): Anomaly sensitivity — lower = more anomalies detected
  - **Top-K** (1–100): Number of top components to return
  - **Variance Threshold** (5–1000): QuadTree pruning — lower = more subdivision

### Center — Canvas Image Viewer
- **PGM rendering** via custom Canvas-based renderer (parses P2/P5 binary format in JavaScript)
- **Dual view mode:** toggle between original input and analysis output
- **Interactive overlays:**
  - Anomalous region rectangles color-coded by component
  - Component bounding boxes (dashed outlines)
  - Hover tooltips showing Z-score for each region
  - Crosshair corner markers on highlighted regions

### Right Sidebar — Results Dashboard
- **Telemetry panel:** 8-stat grid showing resolution, mean, stddev, anomaly count, region count, component count, QuadTree nodes, and total time
- **Pipeline timing chart:** Horizontal bar chart breaking down each stage's execution time in milliseconds
- **Regions table:** Sortable list of all Top-K regions with rank, position (x, y), size, Z-score, mean, and component ID. Hovering a row highlights the corresponding region on the canvas

### Design System
- Dark satellite-operations theme with phosphor green (#00ffc8) accents
- Frosted glass panels with backdrop blur
- JetBrains Mono for numerical data, Oxanium for headings
- Scanline and pulse-glow animations for an aerospace aesthetic

```
Frontend components:
  src/App.jsx              — 3-panel layout orchestration
  src/components/Header.jsx         — Top bar with branding and system status
  src/components/ImageUploader.jsx  — Upload, test images, parameter sliders
  src/components/ImageViewer.jsx    — Canvas renderer with overlay system
  src/components/StatsPanel.jsx     — 8-stat telemetry grid
  src/components/TimingChart.jsx    — Pipeline timing bar chart
  src/components/RegionsTable.jsx   — Sortable results table
  src/components/LoadingOverlay.jsx — Animated processing overlay
  src/hooks/useAnalysis.js          — API communication hook
  src/utils/pgm.js                  — PGM parser and canvas renderer
```

---

## Backend — FastAPI Server

The Python backend serves as the orchestration layer between the frontend and the C++ engine.

**Responsibilities:**
1. **Image format conversion** — Accepts PNG, JPG, TIFF, BMP via Pillow, converts to PGM for the C++ engine
2. **Vegetation-enhanced preprocessing** — Custom grayscale weights (0.15R + 0.70G + 0.15B)
3. **Histogram equalization** — Contrast enhancement for real-world satellite imagery
4. **Automatic scaling** — Downscales images > 1024px using Lanczos interpolation
5. **C++ binary execution** — Invokes the `skymatrix` binary via subprocess with a 30-second timeout
6. **Static file serving** — Serves uploaded images, output images, and the built React frontend
7. **Test image management** — Lists and serves built-in test PGM images

```
File: web/backend/main.py
Framework: FastAPI with Uvicorn
Dependencies: Pillow, NumPy, python-multipart
```

---

## API Reference

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{ "status": "ok", "binary_exists": true }
```

### `GET /api/test-images`
List available test images.

**Response:**
```json
{
  "images": [
    { "name": "satellite_256.pgm", "size": 65793 },
    { "name": "terrain_512.pgm", "size": 262401 }
  ]
}
```

### `POST /api/analyze`
Run analysis on an image.

**Form Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `file` | UploadFile | null | Image file (PNG, JPG, TIFF, BMP, PGM) |
| `test_image` | string | null | Test image filename (alternative to file upload) |
| `block_size` | int | 16 | Minimum QuadTree block size in pixels |
| `z_threshold` | float | 2.0 | Z-score threshold for anomaly detection |
| `top_k` | int | 10 | Number of top components to select |
| `variance_threshold` | float | 100.0 | QuadTree variance pruning threshold |

**Response:**
```json
{
  "image_width": 512,
  "image_height": 512,
  "global_mean": 127.4523,
  "global_stddev": 45.2301,
  "quadtree_nodes": 1365,
  "quadtree_leaves": 1024,
  "total_anomalies": 47,
  "timing": {
    "load_ms": 0.82,
    "prefix_sum_ms": 1.24,
    "quadtree_ms": 0.56,
    "anomaly_ms": 0.03,
    "topk_ms": 0.01,
    "components_ms": 0.02,
    "total_ms": 2.68
  },
  "top_k_regions": [
    { "x": 128, "y": 256, "size": 16, "z_score": 4.2301, "region_mean": 34.50 }
  ],
  "components": [
    {
      "id": 0,
      "region_count": 5,
      "max_score": 4.2301,
      "bounding_box": { "x": 120, "y": 248, "w": 64, "h": 48 },
      "regions": [...]
    }
  ],
  "job_id": "a1b2c3d4",
  "input_image_url": "/uploads/a1b2c3d4_image.pgm",
  "output_image_url": "/outputs/a1b2c3d4_output.pgm"
}
```

### `GET /api/test-image-file/{name}`
Serve a specific test image file.

---

## Project Structure

```
SkyMatrix/
├── CMakeLists.txt                    # C++ build configuration (CMake 3.16+)
├── Dockerfile                        # Multi-stage Docker build (3 stages)
│
├── include/skymatrix/                # C++ header files
│   ├── image.hpp                     # Image struct & PGM I/O declarations
│   ├── prefix_sum.hpp               # PrefixSum2D class (2D DP table)
│   ├── quadtree.hpp                 # QuadTree & QuadNode classes
│   ├── anomaly.hpp                  # AnomalyResult struct & detection function
│   ├── top_k.hpp                    # Top-K heap selection
│   ├── union_find.hpp               # UnionFind (DSU) class
│   ├── connected_comp.hpp           # Component struct & grouping function
│   ├── pipeline.hpp                 # PipelineConfig, PipelineResult, orchestration
│   └── cli_parser.hpp               # Command-line argument parser
│
├── src/                              # C++ implementation files
│   ├── main.cpp                      # Entry point — parse args → run pipeline → print report
│   ├── image.cpp                     # PGM loading (P2/P5) and saving
│   ├── prefix_sum.cpp               # 2D prefix sum build + O(1) region queries
│   ├── quadtree.cpp                 # Recursive QuadTree construction + leaf traversal
│   ├── anomaly.cpp                  # Z-score detection with variance boost
│   ├── top_k.cpp                    # Min-heap based Top-K selection
│   ├── union_find.cpp               # Path-compressed union-by-rank DSU
│   ├── connected_comp.cpp           # Adjacency testing + component grouping
│   └── pipeline.cpp                 # 6-stage pipeline orchestration + JSON/image output
│
├── tools/
│   └── generate_test_image.cpp      # Utility to generate synthetic test PGM images
│
├── test_images/                      # Pre-built PGM test images
│
├── web/
│   ├── backend/
│   │   ├── main.py                  # FastAPI server — preprocessing, binary exec, API
│   │   └── requirements.txt         # Python dependencies
│   │
│   └── frontend/
│       ├── package.json             # React 19 + Vite 7 + Tailwind 4
│       ├── vite.config.js           # Dev proxy + plugin config
│       ├── index.html               # SPA entry point
│       └── src/
│           ├── App.jsx              # Root component — 3-panel layout
│           ├── main.jsx             # React DOM entry
│           ├── index.css            # Tailwind config + custom theme + animations
│           ├── components/
│           │   ├── Header.jsx       # Top bar with branding
│           │   ├── ImageUploader.jsx # Upload UI + parameter controls
│           │   ├── ImageViewer.jsx  # Canvas renderer + overlays
│           │   ├── StatsPanel.jsx   # Telemetry dashboard
│           │   ├── TimingChart.jsx  # Pipeline timing visualization
│           │   ├── RegionsTable.jsx # Interactive results table
│           │   └── LoadingOverlay.jsx # Processing animation
│           ├── hooks/
│           │   └── useAnalysis.js   # API communication + state management
│           └── utils/
│               └── pgm.js          # PGM format parser + canvas renderer
│
└── build/                           # CMake build output (generated)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Engine** | C++17, CMake | High-performance pixel-level computation |
| **Backend** | Python 3.12, FastAPI, Uvicorn | API server, image preprocessing, process orchestration |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 | Interactive SPA with canvas rendering |
| **Image Processing** | Pillow, NumPy | Format conversion, grayscale, scaling, equalization |
| **Containerization** | Docker (multi-stage) | Reproducible builds and deployment |
| **Fonts** | Oxanium, JetBrains Mono | Aerospace-themed typography |

---

## Getting Started

### Docker (Recommended)

Build and run the entire stack with a single command:

```bash
docker build -t skymatrix .
docker run -p 8000:8000 skymatrix
```

Open **http://localhost:8000** in your browser.

### Manual Setup

**Prerequisites:**
- C++17 compiler (g++ or clang++)
- CMake 3.16+
- Python 3.10+
- Node.js 18+

**1. Build the C++ engine:**
```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
cd ..
```

**2. Install Python dependencies:**
```bash
pip install fastapi uvicorn[standard] python-multipart numpy Pillow
```

**3. Build the frontend:**
```bash
cd web/frontend
npm install
npm run build
cd ../..
```

**4. Start the server:**
```bash
cd web/backend
python main.py
```

Open **http://localhost:8000** in your browser.

**Development mode** (with hot-reload):
```bash
# Terminal 1 — Backend
cd web/backend && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (proxies API to backend)
cd web/frontend && npm run dev
```

---

## CLI Usage

The C++ binary can be used standalone without the web interface:

```bash
./build/skymatrix \
  --input test_images/satellite_256.pgm \
  --output output/result.pgm \
  --json output/result.json \
  --block-size 16 \
  --z-threshold 2.0 \
  --top-k 10 \
  --variance-thresh 100.0
```

**All CLI flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--input <path>` | string | *required* | Input PGM image path |
| `--output <path>` | string | — | Output PGM with highlighted anomalies |
| `--json <path>` | string | — | Output JSON report path |
| `--block-size <int>` | int | 16 | Minimum QuadTree block size |
| `--z-threshold <float>` | float | 2.0 | Z-score anomaly threshold |
| `--top-k <int>` | int | 10 | Number of top components |
| `--variance-thresh <float>` | float | 100.0 | QuadTree pruning threshold |
| `--no-branch-bound` | flag | — | Disable branch-and-bound optimization |

**Sample output:**
```
========================================
  SkyMatrix Analysis Report
========================================

Image: 256 x 256
Global Mean: 124.85
Global StdDev: 52.30

QuadTree: 341 nodes, 256 leaves
Anomalies detected: 23
Top-K selected: 15
Connected components: 3

--- Top-K Regions ---
  #1: pos=(64,128) size=16 z_score=4.2301 mean=34.50
  #2: pos=(80,128) size=16 z_score=3.8745 mean=41.20
  ...

--- Timing ---
  Image Load:    0.82 ms
  Prefix Sum:    1.24 ms
  QuadTree:      0.56 ms
  Anomaly Det:   0.03 ms
  Top-K Select:  0.01 ms
  Components:    0.02 ms
  TOTAL:         2.68 ms
========================================
```

---

## Configuration Parameters

| Parameter | Range | Default | Effect |
|---|---|---|---|
| **Block Size** | 4–128 px | 16 | Controls spatial resolution of analysis. Smaller blocks detect finer details but increase computation. |
| **Z-Threshold** | 0.1–5.0 σ | 2.0 | Anomaly sensitivity. Lower values detect weaker anomalies (more results). 2.0σ = top ~5% of statistical outliers. |
| **Top-K** | 1–100 | 10 | Number of most-anomalous components to return. Increasing K returns more regions. |
| **Variance Threshold** | 5–1000 | 100.0 | QuadTree pruning aggressiveness. Lower values force more subdivision (finer tree, more leaves). Higher values produce coarser trees. |

**Parameter interaction guide:**
- For **broad survey** (find major anomalies): block_size=32, z_threshold=2.5, top_k=5
- For **fine-grained analysis** (catch subtle patterns): block_size=4, z_threshold=1.5, top_k=50
- For **fast overview** (large images): block_size=64, variance_threshold=500, top_k=10

---

<p align="center">
  Built with C++17, React, and FastAPI<br/>
  <sub>Algorithms: Dynamic Programming &middot; Divide & Conquer &middot; Min-Heap &middot; Union-Find &middot; Z-Score Statistics</sub>
</p>
