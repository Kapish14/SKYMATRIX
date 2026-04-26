import React from 'react';

export default function Home({ onEnter }) {
  return (
    <div className="h-screen w-full bg-void flex flex-col overflow-hidden text-light antialiased">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-signal/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <svg className="w-4 h-4 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-slate">SKYMATRIX</h1>
            <p className="font-mono text-[9px] text-cyan uppercase tracking-widest font-bold">Algorithmic Analytics</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 z-10 text-center max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/5 border border-cyan/20">
          <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span className="font-mono text-[10px] uppercase font-bold text-cyan tracking-wider">Project Defense Ready</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate mb-6 tracking-tight leading-tight">
          Satellite Image Analytics <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-signal">Without the CNN Overhead.</span>
        </h1>

        <p className="text-slate/60 max-w-2xl text-sm md:text-base font-medium mb-12 leading-relaxed">
          Machine learning over massive satellite imagery is computationally expensive, often running at <code className="bg-slate/10 px-1 py-0.5 rounded text-cyan">O(W×H)</code>.
          SkyMatrix uses dynamic programming (2D Prefix Sums) and divide-and-conquer (QuadTree Decomposition) to filter out 95% of empty space in <code className="bg-slate/10 px-1 py-0.5 rounded text-cyan">O(1)</code> time.
          <br /><br />
          We extract anomalous chunks and run a purely mathematical <strong>Rule-Based Classifier</strong> on pixel variance to identify Urban Sprawl, Water Bodies, and Wildfires. No deep learning required.
        </p>

        <button
          onClick={onEnter}
          className="group relative px-8 py-4 bg-cyan text-white font-mono text-sm font-bold uppercase tracking-widest rounded shadow-lg overflow-hidden transition-transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/20 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
          Enter SkyMatrix Dashboard
        </button>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          {[
            { title: "Dynamic Programming", desc: "Integral Images for instant area sum queries.", icon: "⚡" },
            { title: "Divide & Conquer", desc: "QuadTree variance thresholding for fast pruning.", icon: "🌳" },
            { title: "Rule-Based Filter", desc: "Mathematical pixel analysis for classification.", icon: "📊" }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 bg-white shadow-sm border border-edge/50">
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="font-mono text-xs font-bold text-slate uppercase mb-2">{feature.title}</h3>
              <p className="text-slate/60 text-xs">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center z-10">
        <p className="font-mono text-[10px] text-slate/40 uppercase tracking-widest">
          Algorithms Course Project • Built with C++ & Python
        </p>
      </footer>
    </div>
  );
}
