const STAGES = [
  { key: 'load_ms', label: 'Image Load', abbr: 'LOAD', color: '#6b7fa3' },
  { key: 'prefix_sum_ms', label: 'Prefix Sum (DP)', abbr: 'PFX', color: '#00d4ff' },
  { key: 'quadtree_ms', label: 'QuadTree (D&C)', abbr: 'QUAD', color: '#a855f7' },
  { key: 'anomaly_ms', label: 'Anomaly Detection', abbr: 'ANOM', color: '#ff3c5f' },
  { key: 'topk_ms', label: 'Top-K (Heap)', abbr: 'TOPK', color: '#ffaa00' },
  { key: 'components_ms', label: 'Components (UF)', abbr: 'COMP', color: '#00ffc8' },
];

export default function TimingChart({ results }) {
  if (!results) return null;

  const timing = results.timing;
  const maxTime = Math.max(...STAGES.map(s => timing[s.key]), 0.01);

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-warn" />
        <span className="font-mono text-[11px] tracking-widest text-warn uppercase">Pipeline Timing</span>
      </div>

      <div className="glass-panel p-3 space-y-2.5">
        {STAGES.map((stage, i) => {
          const val = timing[stage.key];
          const pct = (val / maxTime) * 100;

          return (
            <div key={stage.key} className="animate-fade-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                  <span className="font-mono text-[10px] text-slate">{stage.label}</span>
                </div>
                <span className="font-mono text-[10px] font-medium" style={{ color: stage.color }}>
                  {val < 0.01 ? '<0.01' : val.toFixed(2)}ms
                </span>
              </div>
              <div className="h-1.5 bg-deep rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    background: `linear-gradient(90deg, ${stage.color}88, ${stage.color})`,
                    boxShadow: `0 0 8px ${stage.color}44`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-2 mt-2 border-t border-edge/50 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted uppercase">Total Pipeline</span>
          <span className="font-mono text-sm font-bold text-phosphor text-glow-phosphor">
            {timing.total_ms.toFixed(2)}ms
          </span>
        </div>
      </div>
    </div>
  );
}
