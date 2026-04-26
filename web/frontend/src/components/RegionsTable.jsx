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
    
    // Fallback for strings like classification
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

  const columns = [
    { key: 'rank', label: '#', w: 'w-6' },
    { key: 'x', label: 'X/Y', w: 'w-12', sortable: true },
    { key: 'classification', label: 'TYPE (Rule-Based)', w: 'w-32', sortable: true },
    { key: 'z_score', label: 'Z-SCORE', w: 'w-16', sortable: true },
    { key: 'component', label: 'GRP', w: 'w-10', sortable: true },
  ];

  return (
    <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-mono text-[11px] tracking-widest text-signal uppercase font-bold">Detected Areas</span>
        <span className="ml-auto font-mono text-[9px] text-slate font-bold bg-slate/5 px-2 py-0.5 rounded border border-edge">{regions.length} SIGS</span>
      </div>

      <div className="glass-panel overflow-hidden bg-white shadow-sm">
        {/* Table header */}
        <div className="flex items-center px-4 py-2 bg-abyss border-b border-edge">
          {columns.map(col => (
            <div
              key={col.key}
              className={`${col.w} flex-shrink-0 font-mono text-[9px] text-slate uppercase font-bold tracking-wider
                ${col.sortable ? 'cursor-pointer hover:text-cyan' : ''}`}
              onClick={() => col.sortable && handleSort(col.key)}
            >
              {col.label}
              {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
            </div>
          ))}
        </div>

        {/* Table body */}
        <div className="max-h-[320px] overflow-y-auto">
          {regions.length > 0 ? regions.map((region, i) => {
            const compId = getComponentId(region, components);
            const compColor = compId >= 0 ? COMPONENT_COLORS[compId % COMPONENT_COLORS.length] : '#94a3b8';
            const isHighlighted = highlightedRegion &&
              highlightedRegion.x === region.x && highlightedRegion.y === region.y;

            return (
              <div
                key={`${region.x}-${region.y}-${i}`}
                className={`flex items-center px-4 py-2.5 border-b border-edge/50 transition-all duration-150 cursor-pointer
                  ${isHighlighted ? 'bg-cyan/5 border-l-4 border-l-cyan' : 'hover:bg-abyss'}`}
                onMouseEnter={() => onRegionHover?.(region)}
                onMouseLeave={() => onRegionHover?.(null)}
              >
                <div className="w-6 flex-shrink-0 font-mono text-[10px] text-slate/40">{i + 1}</div>
                <div className="w-12 flex-shrink-0 font-mono text-[10px] text-bright font-bold">{region.x},{region.y}</div>
                
                <div className="w-32 flex-shrink-0 font-mono text-[10px] font-bold">
                    <span className="bg-slate/5 border border-edge px-1.5 py-0.5 rounded text-cyan truncate inline-block max-w-[110px]">
                      {region.classification || 'Unknown'}
                    </span>
                </div>

                <div className="w-16 flex-shrink-0 font-mono text-[11px] font-black" style={{ color: zScoreColor(region.z_score) }}>
                  {region.z_score.toFixed(2)}
                </div>
                
                <div className="w-10 flex-shrink-0 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm" style={{ background: compColor }} />
                  <span className="font-mono text-[9px] font-bold" style={{ color: compColor }}>
                    {compId >= 0 ? `G${compId}` : '—'}
                  </span>
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
