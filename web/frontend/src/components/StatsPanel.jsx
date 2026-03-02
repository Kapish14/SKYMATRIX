const STATS_CONFIG = [
  {
    key: 'dimensions',
    label: 'Resolution',
    format: (r) => `${r.image_width}×${r.image_height}`,
    color: 'text-bright',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'mean',
    label: 'Global Mean',
    format: (r) => r.global_mean.toFixed(2),
    color: 'text-cyan',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12h18M8 7l4 10 4-10" />
      </svg>
    ),
  },
  {
    key: 'stddev',
    label: 'Std Deviation',
    format: (r) => r.global_stddev.toFixed(2),
    color: 'text-cyan',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 17c3-2 5-12 9-12s6 12 9 12" />
      </svg>
    ),
  },
  {
    key: 'anomalies',
    label: 'Anomalies',
    format: (r) => r.total_anomalies,
    color: 'text-signal',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    key: 'topk',
    label: 'Top-K Regions',
    format: (r) => r.top_k_regions?.length || 0,
    color: 'text-phosphor',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M5 21V7l5-4 5 4v14M9 21v-6h2v6" />
      </svg>
    ),
  },
  {
    key: 'components',
    label: 'Components',
    format: (r) => r.components?.length || 0,
    color: 'text-nova',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" />
        <path d="M9 6h6M6 9v6M18 9v6M9 18h6" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'nodes',
    label: 'QuadTree Nodes',
    format: (r) => r.quadtree_nodes,
    color: 'text-warn',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M12 3v18M3 12h18" />
      </svg>
    ),
  },
  {
    key: 'time',
    label: 'Total Time',
    format: (r) => `${r.timing.total_ms.toFixed(1)}ms`,
    color: 'text-phosphor',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

export default function StatsPanel({ results }) {
  if (!results) return null;

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-cyan" />
        <span className="font-mono text-[11px] tracking-widest text-cyan uppercase">Telemetry</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATS_CONFIG.map((stat, i) => (
          <div
            key={stat.key}
            className="glass-panel px-3 py-2.5 animate-fade-up group hover:border-phosphor/20 transition-colors"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-muted group-hover:text-slate transition-colors">{stat.icon}</span>
              <span className="font-mono text-[9px] text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className={`font-mono text-sm font-semibold ${stat.color}`}>
              {stat.format(results)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
