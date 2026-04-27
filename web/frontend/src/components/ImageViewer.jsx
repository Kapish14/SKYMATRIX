import { useRef, useEffect, useState, useCallback } from 'react';
import { parsePGM, renderPGMToCanvas } from '../utils/pgm';

export default function ImageViewer({ results, highlightedRegion, onRegionHover }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pgmData, setPgmData] = useState(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [viewMode, setViewMode] = useState('original'); // 'original' | 'processed'
  const [tooltip, setTooltip] = useState(null);
  const [scale, setScale] = useState(1);

  // Load image data (PGM or converted from regular image)
  useEffect(() => {
    if (!results) { setPgmData(null); return; }

    const url = viewMode === 'processed' ? results.output_image_url : results.input_image_url;

    // Try PGM parse first; fall back to loading as regular image via <img> + canvas
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const bytes = new Uint8Array(buf);
        const header = String.fromCharCode(bytes[0], bytes[1]);

        if (header === 'P5' || header === 'P2') {
          // Native PGM
          const data = parsePGM(buf);
          setPgmData(data);
        } else {
          // Non-PGM (PNG/JPG/etc) — decode via browser Image API and extract grayscale
          const blob = new Blob([buf]);
          const imgUrl = URL.createObjectURL(blob);
          const img = new window.Image();
          img.onload = () => {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = img.width;
            tmpCanvas.height = img.height;
            const ctx = tmpCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            const pixels = new Uint8Array(img.width * img.height);
            for (let i = 0; i < pixels.length; i++) {
              // Convert to grayscale: 0.299R + 0.587G + 0.114B
              pixels[i] = Math.round(
                imgData.data[i * 4] * 0.299 +
                imgData.data[i * 4 + 1] * 0.587 +
                imgData.data[i * 4 + 2] * 0.114
              );
            }
            setPgmData({ width: img.width, height: img.height, maxval: 255, pixels });
            URL.revokeObjectURL(imgUrl);
          };
          img.src = imgUrl;
        }
      })
      .catch(err => console.error('Failed to load image:', err));
  }, [results, viewMode]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current || !pgmData) return;

    const regions = showOverlays ? (results?.top_k_regions || []) : [];
    const components = showOverlays ? (results?.components || []) : [];
    renderPGMToCanvas(canvasRef.current, pgmData, regions, components, highlightedRegion);
  }, [pgmData, results, showOverlays, highlightedRegion]);

  // Fit canvas to container
  useEffect(() => {
    if (!pgmData || !containerRef.current) return;
    const container = containerRef.current;
    const maxW = container.clientWidth - 16;
    const maxH = container.clientHeight - 16;
    const s = Math.min(maxW / pgmData.width, maxH / pgmData.height, 1);
    setScale(s);
  }, [pgmData]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !results?.top_k_regions) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const displayScale = canvasRef.current.width / rect.width;
    const mx = (e.clientX - rect.left) * displayScale;
    const my = (e.clientY - rect.top) * displayScale;

    const region = results.top_k_regions.find(r =>
      mx >= r.x && mx <= r.x + (r.width ?? r.size) &&
      my >= r.y && my <= r.y + (r.height ?? r.size)
    );

    if (region) {
      setTooltip({
        x: e.clientX - containerRef.current.getBoundingClientRect().left + 12,
        y: e.clientY - containerRef.current.getBoundingClientRect().top - 10,
        region,
      });
      onRegionHover?.(region);
    } else {
      setTooltip(null);
      onRegionHover?.(null);
    }
  }, [results, onRegionHover]);

  if (!results) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-muted">
        <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.5">
          <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <div className="text-center">
          <p className="font-display text-sm text-slate">No image loaded</p>
          <p className="font-mono text-[10px] mt-1">Upload an image or select a test image to begin</p>
        </div>
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--color-muted) 1px, transparent 1px), linear-gradient(90deg, var(--color-muted) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 animate-fade-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-deep rounded-md p-0.5 border border-edge">
          {['original', 'processed'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded font-mono text-[10px] uppercase tracking-wider transition-all duration-200
                ${viewMode === mode
                  ? 'bg-surface text-phosphor shadow-sm'
                  : 'text-muted hover:text-slate'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-8 h-4 rounded-full transition-colors duration-200 relative
                ${showOverlays ? 'bg-phosphor/30' : 'bg-edge'}`}
              onClick={() => setShowOverlays(!showOverlays)}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200
                ${showOverlays ? 'left-4.5 bg-phosphor' : 'left-0.5 bg-muted'}`}
              />
            </div>
            <span className="font-mono text-[10px] text-slate uppercase">ROI Overlay</span>
          </label>

          <span className="font-mono text-[10px] text-muted">
            {results.image_width}×{results.image_height}
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg border border-edge bg-void/50"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setTooltip(null); onRegionHover?.(null); }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: pgmData ? pgmData.width * scale : 0,
            height: pgmData ? pgmData.height * scale : 0,
            imageRendering: 'pixelated',
          }}
          className="shadow-2xl"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none glass-panel px-3 py-2 border-phosphor/30"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-mono text-[10px] space-y-0.5">
              <div className="text-phosphor font-semibold">Region ({tooltip.region.x}, {tooltip.region.y})</div>
              <div className="text-slate">Size: {(tooltip.region.width ?? tooltip.region.size)}×{(tooltip.region.height ?? tooltip.region.size)}px</div>
              <div className="text-slate">Z-Score: <span className="text-signal">{tooltip.region.z_score.toFixed(3)}</span></div>
              <div className="text-slate">Mean: {tooltip.region.region_mean.toFixed(1)}</div>
            </div>
          </div>
        )}

        {/* Crosshair overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-phosphor/30" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-phosphor/30" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-phosphor/30" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-phosphor/30" />
        </div>
      </div>
    </div>
  );
}
