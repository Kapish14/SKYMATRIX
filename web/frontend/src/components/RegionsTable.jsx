import { useState } from 'react';

const COMPONENT_COLORS = [
  '#00ffc8', '#ff3c5f', '#00d4ff', '#ffaa00', '#a855f7', '#ff6b9d', '#39ff14', '#ff5722',
];

function zScoreColor(z) {
  if (z >= 4) return '#ff3c5f';
  if (z >= 3) return '#ffaa00';
  if (z >= 2) return '#00ffc8';
  return '#6b7fa3';
}

function getComponentId(region, components) {
  for (const comp of components) {
    if (comp.regions.some(r => r.x === region.x && r.y === region.y && r.size === region.size)) {
      return comp.id;
    }
  }
  return -1;
}

export default function RegionsTable({ results, highlightedRegion, onRegionHover }) {
  const [sortKey, setSortKey] = useState('z_score');
  const [sortDir, setSortDir] = useState('desc');

  if (!results) return null;

  const regions = [...(results.top_k_regions || [])];
  const components = results.components || [];

  regions.sort((a, b) => {
    const av = sortKey === 'component' ? getComponentId(a, components) : a[sortKey];
    const bv = sortKey === 'component' ? getComponentId(b, components) : b[sortKey];
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
    <span className={`ml-0.5 text-[8px] ${active ? 'text-phosphor' : 'text-muted/30'}`}>
      {active ? (dir === 'desc' ? '▼' : '▲') : '◆'}
    </span>
  );

  const columns = [
    { key: 'rank', label: '#', w: 'w-8' },
    { key: 'x', label: 'X', w: 'w-12', sortable: true },
    { key: 'y', label: 'Y', w: 'w-12', sortable: true },
    { key: 'size', label: 'Size', w: 'w-12', sortable: true },
    { key: 'z_score', label: 'Z-Score', w: 'w-20', sortable: true },
    { key: 'region_mean', label: 'Mean', w: 'w-14', sortable: true },
    { key: 'component', label: 'Comp', w: 'w-12', sortable: true },
  ];

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-mono text-[11px] tracking-widest text-signal uppercase">Detected Regions</span>
        <span className="ml-auto font-mono text-[10px] text-muted">{regions.length} regions</span>
      </div>

      <div className="glass-panel overflow-hidden">
        {/* Table header */}
        <div className="flex items-center px-3 py-2 border-b border-edge/50 bg-deep/50">
          {columns.map(col => (
            <div
              key={col.key}
              className={`${col.w} flex-shrink-0 font-mono text-[9px] text-muted uppercase tracking-wider
                ${col.sortable ? 'cursor-pointer hover:text-slate' : ''}`}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              {col.label}
              {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
            </div>
          ))}
        </div>

        {/* Table body */}
        <div className="max-h-[280px] overflow-y-auto">
          {regions.map((region, i) => {
            const compId = getComponentId(region, components);
            const compColor = compId >= 0 ? COMPONENT_COLORS[compId % COMPONENT_COLORS.length] : '#3a4d6e';
            const isHighlighted = highlightedRegion &&
              highlightedRegion.x === region.x && highlightedRegion.y === region.y;

            return (
              <div
                key={`${region.x}-${region.y}-${i}`}
                className={`flex items-center px-3 py-1.5 border-b border-edge/20 transition-colors duration-150 cursor-pointer
                  ${isHighlighted ? 'bg-phosphor/10 border-l-2 border-l-phosphor' : 'hover:bg-surface/50'}`}
                onMouseEnter={() => onRegionHover?.(region)}
                onMouseLeave={() => onRegionHover?.(null)}
              >
                <div className="w-8 flex-shrink-0 font-mono text-[10px] text-muted">{i + 1}</div>
                <div className="w-12 flex-shrink-0 font-mono text-[10px] text-slate">{region.x}</div>
                <div className="w-12 flex-shrink-0 font-mono text-[10px] text-slate">{region.y}</div>
                <div className="w-12 flex-shrink-0 font-mono text-[10px] text-slate">{region.size}</div>
                <div className="w-20 flex-shrink-0 font-mono text-[11px] font-semibold" style={{ color: zScoreColor(region.z_score) }}>
                  {region.z_score.toFixed(3)}
                </div>
                <div className="w-14 flex-shrink-0 font-mono text-[10px] text-slate">
                  {region.region_mean.toFixed(1)}
                </div>
                <div className="w-12 flex-shrink-0 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: compColor }} />
                  <span className="font-mono text-[10px]" style={{ color: compColor }}>
                    {compId >= 0 ? `C${compId}` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
