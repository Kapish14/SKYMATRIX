import { useState } from 'react';

const COMPONENT_COLORS = [
  '#0d9488', '#e11d48', '#0891b2', '#d97706', '#7c3aed', '#ec4899', '#16a34a', '#ea580c',
];

function zScoreColor(z) {
  if (z >= 4) return '#e11d48';
  if (z >= 3) return '#d97706';
  if (z >= 2) return '#0d9488';
  return '#64748b';
}

function getComponentId(region, components) {
  if (typeof region.component_id === 'number' && region.component_id >= 0) {
    return region.component_id;
  }
  for (const comp of components) {
    if (comp.regions.some(r => r.x === region.x && r.y === region.y && r.size === region.size)) {
      return comp.id;
    }
  }
  return -1;
}

function getRegionMetrics(region, components, results) {
  const componentId = getComponentId(region, components);
  const width = region.width ?? region.size;
  const height = region.height ?? region.size;
  const area = width * height;
  const imageArea = Math.max(1, results.image_width * results.image_height);
  const coverage = (area / imageArea) * 100;

  return {
    componentId,
    coverage,
  };
}

export default function RegionsTable({ results, highlightedRegion, onRegionHover }) {
  const [sortKey, setSortKey] = useState('z_score');
  const [sortDir, setSortDir] = useState('desc');

  if (!results) return null;

  const regions = [...(results.top_k_regions || [])].map(region => ({
    ...region,
    metrics: getRegionMetrics(region, results.components || [], results),
  }));
  const components = results.components || [];

  regions.sort((a, b) => {
    const lookup = (region, key) => {
      if (key === 'coverage') return region.metrics.coverage;
      return region[key];
    };

    const av = lookup(a, sortKey);
    const bv = lookup(b, sortKey);

    if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
    }
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ active, dir }) => (
    <span className={`ml-1 text-[8px] ${active ? 'text-cyan' : 'text-slate/30'}`}>
      {active ? (dir === 'desc' ? '▼' : '▲') : '◆'}
    </span>
  );

  const sortOptions = [
    { key: 'z_score', label: 'Severity' },
    { key: 'coverage', label: 'Coverage' },
  ];

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-mono text-[11px] tracking-widest text-signal uppercase font-bold">Final Regions</span>
        <span className="ml-auto font-mono text-[9px] text-slate font-bold bg-slate/5 px-2 py-0.5 rounded border border-edge">{regions.length} AREAS</span>
      </div>

      <div className="glass-panel overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 bg-abyss border-b border-edge">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] text-slate uppercase font-bold tracking-wider">Merged Anomaly Summary</div>
              <div className="font-mono text-[10px] text-slate/70 mt-1">Showing the larger final regions by anomaly strength and image coverage.</div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {sortOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => handleSort(option.key)}
                  className={`px-2 py-1 rounded border font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    sortKey === option.key
                      ? 'border-cyan/30 bg-cyan/5 text-cyan'
                      : 'border-edge bg-white text-slate hover:text-cyan hover:border-cyan/20'
                  }`}
                >
                  {option.label}
                  <SortIcon active={sortKey === option.key} dir={sortDir} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-3 py-2 space-y-2">
          {regions.length > 0 ? regions.map((region, i) => {
            const { componentId: compId, coverage } = region.metrics;
            const compColor = compId >= 0 ? COMPONENT_COLORS[compId % COMPONENT_COLORS.length] : '#94a3b8';
            const isHighlighted = highlightedRegion &&
              highlightedRegion.x === region.x && highlightedRegion.y === region.y;

            return (
              <div
                key={`${region.x}-${region.y}-${i}`}
                className={`rounded-xl border px-4 py-3 transition-all duration-150 cursor-pointer ${
                  isHighlighted
                    ? 'bg-cyan/5 border-cyan/40 shadow-sm'
                    : 'border-edge/60 hover:bg-abyss hover:border-cyan/20'
                }`}
                onMouseEnter={() => onRegionHover?.(region)}
                onMouseLeave={() => onRegionHover?.(null)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm" style={{ background: compColor }} />
                      <span className="font-mono text-[10px] text-slate/50 uppercase font-bold">Region {i + 1}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                      <div>
                        <div className="font-mono text-[9px] text-slate uppercase font-bold tracking-wider">Coverage</div>
                        <div className="font-mono text-[11px] text-bright font-bold">{coverage.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono text-[9px] text-slate uppercase font-bold tracking-wider">Severity</div>
                    <div className="font-mono text-lg font-black" style={{ color: zScoreColor(region.z_score) }}>
                      {region.z_score.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-12 text-center text-slate/40 font-mono text-[10px]">
              No regions detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
