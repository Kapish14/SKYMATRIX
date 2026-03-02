export default function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-edge/50 bg-abyss/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Logo mark */}
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-md bg-phosphor/10 border border-phosphor/30 animate-[pulse-glow_3s_ease-in-out_infinite]" />
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-phosphor relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeOpacity="0.5" />
            <circle cx="12" cy="12" r="9" strokeDasharray="3 3" strokeOpacity="0.3" />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-bright text-glow-phosphor">
            SKYMATRIX
          </h1>
          <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
            Satellite Image Analytics Engine
          </p>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate">
          <span className="w-1.5 h-1.5 rounded-full bg-phosphor animate-[pulse-glow_2s_ease-in-out_infinite]" />
          SYSTEM ONLINE
        </div>
        <div className="font-mono text-[11px] text-muted">
          {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
        </div>
      </div>
    </header>
  );
}
