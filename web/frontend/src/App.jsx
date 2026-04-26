import { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageViewer from './components/ImageViewer';
import StatsPanel from './components/StatsPanel';
import TimingChart from './components/TimingChart';
import RegionsTable from './components/RegionsTable';
import LoadingOverlay from './components/LoadingOverlay';
import TutorialSystem from './components/TutorialSystem';
import Home from './components/Home';
import { useAnalysis } from './hooks/useAnalysis';

export default function App() {
  const { results, loading, error, analyze } = useAnalysis();
  const [highlightedRegion, setHighlightedRegion] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Only trigger tutorial if dashboard is shown and not seen
    if (showDashboard) {
      const seen = localStorage.getItem('skymatrix-tutorial-seen');
      if (!seen) {
        setTimeout(() => setShowTutorial(true), 1000);
      }
    }
  }, [showDashboard]);

  if (!showDashboard) {
    return <Home onEnter={() => setShowDashboard(true)} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-void text-light">
      <Header onShowTutorial={() => setShowTutorial(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Upload & Config */}
        <aside 
          data-tour="upload-panel"
          className="w-72 flex-shrink-0 border-r border-edge bg-abyss p-4 overflow-y-auto"
        >
          <div data-tour="params-panel">
            <ImageUploader onAnalyze={analyze} loading={loading} />
          </div>

          {error && (
            <div className="mt-4 glass-panel border-signal/30 px-3 py-2 animate-fade-up">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-signal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <span className="font-mono text-[10px] text-signal uppercase font-bold">Error</span>
              </div>
              <p className="font-mono text-[10px] text-slate">{error}</p>
            </div>
          )}
        </aside>

        {/* Center — Image Viewer */}
        <main 
          data-tour="image-viewer"
          className="flex-1 relative p-4 overflow-hidden bg-deep/30"
        >
          <ImageViewer
            results={results}
            highlightedRegion={highlightedRegion}
            onRegionHover={setHighlightedRegion}
          />
          <LoadingOverlay visible={loading} />
        </main>

        {/* Right Sidebar — Results */}
        <aside 
          data-tour="results-panel"
          className="w-[380px] flex-shrink-0 border-l border-edge bg-abyss p-4 overflow-y-auto"
        >
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
              <div className="w-16 h-16 rounded-full bg-cyan/5 flex items-center justify-center mb-4 border border-cyan/10">
                <svg className="w-8 h-8 text-cyan/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-mono text-[10px] text-center text-slate max-w-[160px]">
                Analysis results will be displayed here after processing
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-edge bg-white/80 backdrop-blur-sm text-[9px] font-mono text-slate">
        <span className="font-bold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-phosphor" />
          SKYMATRIX ENGINE v1.0
        </span>
        <div className="flex items-center gap-4">
          <span>ALGORITHMS: DP · D&C · HEAP · UNION-FIND</span>
          <span className="text-edge">|</span>
          <button 
            onClick={() => setShowTutorial(true)}
            className="text-cyan hover:underline font-bold"
          >
            OPEN DOCUMENTATION
          </button>
        </div>
      </div>

      {showTutorial && <TutorialSystem onFinish={() => setShowTutorial(false)} />}
    </div>
  );
}
