const PIPELINE_STAGES = [
  'Loading satellite image...',
  'Computing 2D prefix sums...',
  'Building QuadTree decomposition...',
  'Running Z-Score anomaly detection...',
  'Selecting Top-K regions...',
  'Detecting connected components...',
  'Generating output report...',
];

export default function LoadingOverlay({ visible }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-void/80 backdrop-blur-sm">
      <div className="glass-panel glow-phosphor p-6 w-72 animate-fade-up">
        {/* Spinner */}
        <div className="flex justify-center mb-5">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 animate-spin" viewBox="0 0 50 50" style={{ animationDuration: '2s' }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--color-edge)" strokeWidth="2" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--color-phosphor)" strokeWidth="2"
                strokeDasharray="30 95" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-phosphor/60 animate-[pulse-glow_1s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        <h3 className="font-display text-sm text-center text-phosphor font-semibold tracking-wider mb-4 text-glow-phosphor">
          PROCESSING
        </h3>

        {/* Animated pipeline stages */}
        <div className="space-y-1.5">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={i}
              className="flex items-center gap-2 animate-fade-up opacity-0"
              style={{
                animationDelay: `${0.3 + i * 0.4}s`,
                animationFillMode: 'forwards',
              }}
            >
              <div className="w-1 h-1 rounded-full bg-phosphor/60" />
              <span className="font-mono text-[9px] text-slate">{stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
