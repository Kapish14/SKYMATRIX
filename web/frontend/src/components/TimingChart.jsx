const STAGES = [
  { key: 'load_ms', label: 'Image Load', abbr: 'LOAD', color: '#64748b' },
  { key: 'prefix_sum_ms', label: 'Prefix Sum (DP)', abbr: 'PFX', color: '#0891b2' },
  { key: 'quadtree_ms', label: 'QuadTree (D&C)', abbr: 'QUAD', color: '#7c3aed' },
  { key: 'anomaly_ms', label: 'Anomaly Detection', abbr: 'ANOM', color: '#e11d48' },
  { key: 'topk_ms', label: 'Top-K (Min-Heap)', abbr: 'TOPK', color: '#d97706' },
  { key: 'components_ms', label: 'Components (DSU)', abbr: 'COMP', color: '#0d9488' },
];

export default function TimingChart({ results }) {
  if (!results) return null;

  const timing = results.timing;
  const maxTime = Math.max(...STAGES.map(s => timing[s.key]), 0.01);

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1 h-4 rounded-full bg-warn" />
        <span className="font-mono text-[11px] tracking-widest text-warn uppercase font-bold">Latency Profile</span>
      </div>

      <div className="glass-panel p-4 space-y-3 bg-white shadow-sm">
        {STAGES.map((stage, i) => {
          const val = timing[stage.key];
          const pct = (val / maxTime) * 100;

          return (
            <div key={stage.key} className="animate-fade-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                  <span className="font-mono text-[10px] text-slate font-bold uppercase tracking-tighter">{stage.label}</span>
                </div>
                <span className="font-mono text-[10px] font-bold" style={{ color: stage.color }}>
                  {val < 0.01 ? '<0.01' : val.toFixed(2)}ms
                </span>
              </div>
              <div className="h-1.5 bg-deep rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    background: `linear-gradient(90deg, ${stage.color}aa, ${stage.color})`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-2 mt-2 border-t border-edge flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate uppercase font-bold">Combined Logic</span>
          <span className="font-mono text-sm font-bold text-phosphor">
            {timing.total_ms.toFixed(2)}ms
          </span>
        </div>
      </div>
    </div>
  );
}
