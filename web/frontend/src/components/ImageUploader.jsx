import { useState, useEffect, useRef } from 'react';

const PARAMS = [
  { key: 'blockSize', label: 'Block Size', min: 4, max: 128, step: 4, default: 16, unit: 'px', tooltip: 'Minimum size of the analysis grid. Lower values provide higher resolution.' },
  { key: 'zThreshold', label: 'Z-Threshold', min: 0.1, max: 5, step: 0.1, default: 1.0, unit: 'σ', tooltip: 'Statistical sensitivity. Lower values detect more subtle anomalies.' },
  { key: 'topK', label: 'Top-K', min: 1, max: 100, step: 1, default: 20, unit: '', tooltip: 'Number of most significant anomaly regions to highlight.' },
  { key: 'varianceThreshold', label: 'Variance Thresh', min: 5, max: 1000, step: 5, default: 30, unit: '', tooltip: 'Controls QuadTree pruning. Higher values keep the tree more simplified.' },
];

export default function ImageUploader({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);
  const [testImages, setTestImages] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [params, setParams] = useState(
    Object.fromEntries(PARAMS.map(p => [p.key, p.default]))
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/test-images')
      .then(r => r.json())
      .then(d => setTestImages(d.images || []))
      .catch(() => {});
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setSelectedTest('');
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setSelectedTest('');
    }
  };

  const handleSubmit = () => {
    if (!file && !selectedTest) return;
    onAnalyze({
      file: file || null,
      testImage: selectedTest || null,
      ...params,
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-slide-left">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-cyan" />
        <span className="font-mono text-[11px] tracking-widest text-bright uppercase font-bold text-cyan">Input Source</span>
      </div>

      {/* Drop zone */}
      <div
        className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-6 text-center
          ${dragOver
            ? 'border-cyan bg-cyan/5 shadow-inner'
            : file
              ? 'border-cyan/40 bg-cyan/5'
              : 'border-edge hover:border-slate hover:bg-abyss shadow-sm'
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pgm,.png,.jpg,.jpeg,.bmp,.tiff,.tif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-cyan/10 flex items-center justify-center mb-1">
              <svg className="w-6 h-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-mono text-xs text-bright font-bold truncate max-w-[180px]">{file.name}</span>
            <span className="font-mono text-[10px] text-slate">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-slate/40 group-hover:text-cyan/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="font-mono text-[11px] text-slate font-bold">Upload image file</span>
            <span className="font-mono text-[9px] text-slate/60 mt-0.5">PGM, PNG, JPG, BMP, TIFF</span>
          </div>
        )}
      </div>

      {/* Test images selector */}
      {testImages.length > 0 && (
        <div className="space-y-2">
          <label className="font-mono text-[10px] tracking-wider text-slate uppercase font-bold block">
            Or select test library
          </label>
          <select
            value={selectedTest}
            onChange={(e) => { setSelectedTest(e.target.value); setFile(null); }}
            className="w-full bg-white border border-edge rounded-lg px-3 py-2.5 font-mono text-xs text-bright focus:outline-none focus:ring-2 focus:ring-cyan/20 focus:border-cyan shadow-sm transition-all"
          >
            <option value="">— select from library —</option>
            {testImages.map(img => (
              <option key={img.name} value={img.name}>
                {img.name} ({(img.size / 1024).toFixed(0)} KB)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-edge to-transparent my-1" />

      {/* Parameters */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-phosphor" />
        <span className="font-mono text-[11px] tracking-widest text-phosphor uppercase font-bold">Algorithm Config</span>
      </div>

      <div className="flex flex-col gap-4">
        {PARAMS.map(p => (
          <div key={p.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 tooltip-trigger">
                <span className="font-mono text-[10px] text-slate uppercase font-bold tracking-wider">{p.label}</span>
                <svg className="w-3 h-3 text-slate/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
                <div className="tooltip-content">{p.tooltip}</div>
              </label>
              <span className="font-mono text-[11px] text-phosphor font-bold bg-phosphor/5 px-2 py-0.5 rounded border border-phosphor/10 shadow-sm">
                {typeof params[p.key] === 'number' && params[p.key] % 1 !== 0
                  ? params[p.key].toFixed(1)
                  : params[p.key]}
                {p.unit && <span className="text-slate/60 ml-0.5">{p.unit}</span>}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={params[p.key]}
              onChange={(e) => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
              className="w-full accent-phosphor"
            />
          </div>
        ))}
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!file && !selectedTest)}
        className={`relative mt-4 w-full py-3.5 rounded-xl font-display text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-md transform active:scale-[0.98]
          ${loading
            ? 'bg-deep text-slate cursor-wait'
            : (!file && !selectedTest)
              ? 'bg-deep text-slate/40 border border-edge cursor-not-allowed'
              : 'bg-cyan text-white border border-cyan/10 hover:bg-cyan/90 hover:shadow-lg hover:shadow-cyan/20'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" />
            </svg>
            PROCESSING...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            RUN ANALYTICS
          </span>
        )}
      </button>
    </div>
  );
}
