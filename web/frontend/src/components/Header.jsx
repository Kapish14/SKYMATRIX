export default function Header({ onShowTutorial }) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-edge bg-white/90 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo mark */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-cyan/5 border border-cyan/20" />
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan relative z-10" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeOpacity="0.5" />
            <circle cx="12" cy="12" r="9" strokeDasharray="3 3" strokeOpacity="0.3" />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-bright">
            SKYMATRIX
          </h1>
          <p className="font-mono text-[9px] tracking-widest text-slate uppercase font-bold">
            Satellite Image Analytics Engine
          </p>
        </div>
      </div>

      {/* Status & Options */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onShowTutorial}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyan/30 bg-cyan/5 text-cyan font-mono text-[11px] font-bold hover:bg-cyan/10 transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
          HOW TO USE
        </button>
        <div className="flex items-center gap-2 font-mono text-[11px] text-phosphor font-bold">
          <span className="w-2 h-2 rounded-full bg-phosphor animate-pulse" />
          ANALYSIS READY
        </div>
      </div>
    </header>
  );
}
