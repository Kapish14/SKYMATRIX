import { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageViewer from './components/ImageViewer';
import StatsPanel from './components/StatsPanel';
import TimingChart from './components/TimingChart';
import RegionsTable from './components/RegionsTable';
import LoadingOverlay from './components/LoadingOverlay';
import { useAnalysis } from './hooks/useAnalysis';

export default function App() {
  const { results, loading, error, analyze } = useAnalysis();
  const [highlightedRegion, setHighlightedRegion] = useState(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Upload & Config */}
        <aside className="w-72 flex-shrink-0 border-r border-edge/40 bg-abyss/40 p-4 overflow-y-auto">
          <ImageUploader onAnalyze={analyze} loading={loading} />

          {error && (
            <div className="mt-4 glass-panel border-signal/30 glow-signal px-3 py-2 animate-fade-up">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-signal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <span className="font-mono text-[10px] text-signal uppercase">Error</span>
              </div>
              <p className="font-mono text-[10px] text-slate">{error}</p>
            </div>
          )}
        </aside>

        {/* Center — Image Viewer */}
        <main className="flex-1 relative p-4 overflow-hidden">
          <ImageViewer
            results={results}
            highlightedRegion={highlightedRegion}
            onRegionHover={setHighlightedRegion}
          />
          <LoadingOverlay visible={loading} />
        </main>

        {/* Right Sidebar — Results */}
        <aside className="w-80 flex-shrink-0 border-l border-edge/40 bg-abyss/40 p-4 overflow-y-auto">
          {results ? (
            <div className="space-y-5">
              <StatsPanel results={results} />
              <TimingChart results={results} />
              <RegionsTable
                results={results}
                highlightedRegion={highlightedRegion}
                onRegionHover={setHighlightedRegion}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted">
              <svg className="w-10 h-10 opacity-20 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 4-6" />
              </svg>
              <p className="font-mono text-[10px] text-center">
                Analysis results will<br />appear here
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-edge/30 bg-abyss/60 text-[9px] font-mono text-muted">
        <span>SkyMatrix v1.0 — Hierarchical Satellite Image Analytics</span>
        <div className="flex items-center gap-4">
          <span>C++17 Engine</span>
          <span className="text-edge">|</span>
          <span>Algorithms: DP · D&C · Heap · Union-Find · DFS · B&B</span>
        </div>
      </div>
    </div>
  );
}
