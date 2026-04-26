import { useState, useEffect } from 'react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SkyMatrix',
    content: 'SkyMatrix is a high-performance satellite image analytics engine. It uses advanced algorithms to find "anomalies" (unusual areas) in satellite imagery.',
    target: 'body',
    position: 'center'
  },
  {
    id: 'upload',
    title: '1. Input Configuration',
    content: 'Start by uploading your own satellite image (PGM, PNG, JPG) or select one from our built-in test library.',
    target: '[data-tour="upload-panel"]',
    position: 'right'
  },
  {
    id: 'params',
    title: '2. Algorithm Parameters',
    content: 'Fine-tune how the "detective" works. Block Size controls resolution, while Z-Threshold sets how sensitive the detection should be.',
    target: '[data-tour="params-panel"]',
    position: 'right'
  },
  {
    id: 'viewer',
    title: '3. Image Viewer',
    content: 'Interact with the results here. You can hover over detected regions to see their statistical significance (Z-Score).',
    target: '[data-tour="image-viewer"]',
    position: 'left'
  },
  {
    id: 'stats',
    title: '4. Analysis Results',
    content: 'View real-time telemetry, processing time breakdown, and a sortable table of all detected hotspots.',
    target: '[data-tour="results-panel"]',
    position: 'left'
  }
];

export default function TutorialSystem({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = STEPS[currentStep];

  useEffect(() => {
    if (step.target === 'body') {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.classList.add('tutorial-highlight');
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      const el = document.querySelector(step.target);
      if (el) el.classList.remove('tutorial-highlight');
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      localStorage.setItem('skymatrix-tutorial-seen', 'true');
      onFinish();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('skymatrix-tutorial-seen', 'true');
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
      {/* Dim Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={handleSkip} />

      {/* Spotlight for highlighting specific parts if needed (CSS tutorial-highlight handles most of it) */}
      
      {/* Content Box */}
      <div className={`relative pointer-events-auto w-80 glass-panel p-6 animate-fade-up border-cyan/50 shadow-xl
        ${step.position === 'center' ? 'mx-auto' : ''}
        ${step.position === 'right' ? 'ml-96' : ''}
        ${step.position === 'left' ? 'mr-96' : ''}
      `}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-mono text-[10px] text-cyan font-bold tracking-widest uppercase">Guide — Step {currentStep + 1} of {STEPS.length}</span>
          <button onClick={handleSkip} className="text-slate hover:text-bright">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <h3 className="font-display text-lg font-bold text-bright mb-2">{step.title}</h3>
        <p className="font-mono text-xs text-slate leading-relaxed mb-6">
          {step.content}
        </p>

        <div className="flex justify-between items-center">
          <button 
            onClick={handleSkip}
            className="font-mono text-[10px] text-slate hover:text-cyan transition-colors"
          >
            SKIP TUTORIAL
          </button>
          
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-cyan text-white rounded font-mono text-[11px] font-bold hover:bg-cyan/90 transition-colors flex items-center gap-2"
          >
            {currentStep === STEPS.length - 1 ? 'FINISH' : 'NEXT'}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
