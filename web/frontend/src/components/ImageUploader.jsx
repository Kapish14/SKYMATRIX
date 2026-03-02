import { useState, useEffect, useRef } from 'react';

const PARAMS = [
  { key: 'blockSize', label: 'Block Size', min: 4, max: 128, step: 4, default: 16, unit: 'px' },
  { key: 'zThreshold', label: 'Z-Threshold', min: 0.1, max: 5, step: 0.1, default: 1.0, unit: 'σ' },
  { key: 'topK', label: 'Top-K', min: 1, max: 100, step: 1, default: 20, unit: '' },
  { key: 'varianceThreshold', label: 'Variance Thresh', min: 5, max: 1000, step: 5, default: 30, unit: '' },
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
    <div className="flex flex-col gap-4 animate-slide-left">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-phosphor" />
        <span className="font-mono text-[11px] tracking-widest text-phosphor uppercase">Input Configuration</span>
      </div>

      {/* Drop zone */}
      <div
        className={`relative group cursor-pointer rounded-lg border-2 border-dashed transition-all duration-300 p-5 text-center
          ${dragOver
            ? 'border-phosphor bg-phosphor/5 glow-phosphor'
            : file
              ? 'border-phosphor/40 bg-phosphor/5'
              : 'border-edge hover:border-muted hover:bg-surface/30'
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
            <svg className="w-6 h-6 text-phosphor" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-xs text-phosphor">{file.name}</span>
            <span className="font-mono text-[10px] text-muted">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-muted group-hover:text-slate transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="font-mono text-[11px] text-slate">Drop image file or click</span>
            <span className="font-mono text-[9px] text-muted mt-0.5">PGM, PNG, JPG, BMP, TIFF</span>
          </div>
        )}
      </div>

      {/* Test images selector */}
      {testImages.length > 0 && (
        <div>
          <label className="font-mono text-[10px] tracking-wider text-muted uppercase block mb-1.5">
            Or select test image
          </label>
          <select
            value={selectedTest}
            onChange={(e) => { setSelectedTest(e.target.value); setFile(null); }}
            className="w-full bg-deep border border-edge rounded-md px-3 py-2 font-mono text-xs text-light focus:outline-none focus:border-phosphor/50 transition-colors"
          >
            <option value="">— choose —</option>
            {testImages.map(img => (
              <option key={img.name} value={img.name}>
                {img.name} ({(img.size / 1024).toFixed(0)} KB)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-edge to-transparent" />

      {/* Parameters */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-4 rounded-full bg-cyan" />
        <span className="font-mono text-[11px] tracking-widest text-cyan uppercase">Algorithm Parameters</span>
      </div>

      <div className="flex flex-col gap-3">
        {PARAMS.map(p => (
          <div key={p.key}>
            <div className="flex justify-between mb-1">
              <label className="font-mono text-[10px] text-slate uppercase tracking-wider">{p.label}</label>
              <span className="font-mono text-[11px] text-phosphor font-medium">
                {typeof params[p.key] === 'number' && params[p.key] % 1 !== 0
                  ? params[p.key].toFixed(1)
                  : params[p.key]}
                {p.unit && <span className="text-muted ml-0.5">{p.unit}</span>}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={params[p.key]}
              onChange={(e) => setParams(prev => ({ ...prev, [p.key]: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!file && !selectedTest)}
        className={`relative mt-2 w-full py-3 rounded-lg font-display text-sm font-semibold tracking-widest uppercase transition-all duration-300
          ${loading
            ? 'bg-surface text-muted cursor-wait'
            : (!file && !selectedTest)
              ? 'bg-surface text-muted cursor-not-allowed'
              : 'bg-phosphor/10 text-phosphor border border-phosphor/40 hover:bg-phosphor/20 hover:shadow-[0_0_30px_rgba(0,255,200,0.15)] active:scale-[0.98]'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" />
            </svg>
            ANALYZING...
          </span>
        ) : (
          'ANALYZE IMAGE'
        )}
      </button>
    </div>
  );
}
