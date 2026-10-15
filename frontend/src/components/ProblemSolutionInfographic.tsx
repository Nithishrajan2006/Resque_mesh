import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Maximize2, 
  WifiOff, 
  Radio, 
  RefreshCw, 
  Database, 
  Layers, 
  Share2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface ProblemSolutionInfographicProps {
  onInspectImage: (id: string) => void;
}

export const ProblemSolutionInfographic: React.FC<ProblemSolutionInfographicProps> = ({
  onInspectImage,
}) => {
  const [viewMode, setViewMode] = useState<'infographic' | 'interactive'>('infographic');

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#061224] via-[#091a34] to-[#050d1a] border border-cyan-500/25 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest font-bold">
              MISSION BLUEPRINT & ARCHITECTURE
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
              100% Offline Resilience
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mt-1">
            The Problem & The Solution: Offline Mesh Paradigm
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-0.5">
            How ResQMesh overcomes catastrophic infrastructure failure through local data stores, peer-to-peer ad-hoc relaying, and idempotent cloud sync.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="p-1 rounded-xl bg-black/40 border border-white/[0.08] flex items-center">
            <button
              onClick={() => setViewMode('infographic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === 'infographic'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🖼️ Visual Infographic
            </button>
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === 'interactive'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Interactive Flow
            </button>
          </div>

          <button
            onClick={() => onInspectImage('problem-solution')}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 transition"
            title="Expand Infographic in High Resolution"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'infographic' ? (
        /* Visual Infographic View: The high-res user image with hover zoom & interactive highlights */
        <div className="space-y-4">
          <div 
            onClick={() => onInspectImage('problem-solution')}
            className="group relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#030914] cursor-pointer shadow-2xl transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-500/20"
          >
            <img 
              src="/images/resqmesh-problem-solution.jpg" 
              alt="ResQMesh Problem and Solution Infographic" 
              className="w-full h-auto object-cover max-h-[520px] transition-transform duration-500 group-hover:scale-[1.01]"
            />

            {/* Hover Inspection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 sm:p-6 pointer-events-none">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  CLICK TO VIEW FULL RESOLUTION INFOGRAPHIC
                </span>
                <p className="text-xs text-slate-300 font-mono">
                  Detailed breakdown of Phase 1 (Local), Phase 2 (Coordinate), and Phase 3 (Sync)
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-bold shadow-lg flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                Inspect High-Res
              </span>
            </div>

            {/* Badges on Top Corners */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-mono font-bold backdrop-blur-md">
                1. THE PROBLEM: INFRASTRUCTURE COLLAPSE
              </span>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[10px] font-mono font-bold backdrop-blur-md">
                2. THE SOLUTION: AD-HOC P2P MESH
              </span>
            </div>
          </div>

          {/* 3 Pillars Explanatory Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-cyan-500/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-cyan-500/30">
                1
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  LOCAL PERSISTENCE
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Each device maintains an independent SQLite ledger. Incidents & inventory are stored locally even if severed from all networks.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-violet-500/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-violet-500/30">
                2
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  PEER COORDINATION
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Devices discover nearby peers via ad-hoc Wi-Fi and simulated LoRa radios. Messages multi-hop across physical terrain.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-emerald-500/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-emerald-500/30">
                3
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  IDEMPOTENT SYNC
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When backhaul connectivity returns, store-and-forward queues flush safely. Cryptographic deduplication prevents ghost records.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Side-by-Side Comparison */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: The Problem */}
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-red-500/20">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                  THE CRITICAL PROBLEM
                </span>
                <h3 className="text-base font-bold text-white">
                  Communication Infrastructure Collapse
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              During cyclones, flash floods, earthquakes, or armed conflicts, conventional cellular networks and centralized cloud servers fail instantaneously.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-red-500/20 flex items-start gap-3">
                <WifiOff className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-red-300 block">Cellular Towers Lose Power:</strong>
                  <span className="text-slate-400">Backbone fiber cuts and power grid blackouts render consumer cell phones useless.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-red-500/20 flex items-start gap-3">
                <Radio className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-red-300 block">Radio Blind Zones:</strong>
                  <span className="text-slate-400">Mountain ridges and dense urban rubble isolate search teams into localized information silos.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-red-300 block">Result: Chaos & Zero Coordination:</strong>
                  <span className="text-slate-400">Casualties remain unextracted, relief supplies double-book, and commander situational awareness drops to zero.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: The Solution */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-500/20">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  THE RESQMESH SOLUTION
                </span>
                <h3 className="text-base font-bold text-white">
                  Decentralized Store-and-Forward Mesh
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard field laptops and tablets transform into autonomous mesh nodes running deterministic local AI agents with zero cloud reliance.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-emerald-300 block">1. Local Store-and-Forward (SQLite):</strong>
                  <span className="text-slate-400">Every incident, task, and inventory change is recorded locally in tamper-resistant tables.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                <Radio className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-emerald-300 block">2. Peer-to-Peer Relay Bus:</strong>
                  <span className="text-slate-400">Devices broadcast packets opportunistically to nearby responders using ad-hoc Wi-Fi and mesh routing.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="text-emerald-300 block">3. Automatic Idempotent Sync:</strong>
                  <span className="text-slate-400">When connections return, all nodes converge on consistent state using SHA-256 idempotency keys.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
