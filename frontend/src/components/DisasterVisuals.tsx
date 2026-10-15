import React from 'react';
import { ShieldCheck, WifiOff, Users, Cpu, Radio, Droplets, HeartPulse, Truck, Plane } from 'lucide-react';

/**
 * High-quality, offline-first tactical disaster illustrations and drone HUD graphics.
 * Works 100% offline without external image dependencies or cloud servers.
 */

// Simulated Drone Aerial Flood Scene
export const FloodAerialScene: React.FC<{
  onInspect?: () => void;
  className?: string;
}> = ({ onInspect, className = '' }) => {
  return (
    <div 
      onClick={onInspect}
      className={`relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#061224] group cursor-pointer shadow-xl transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-500/10 ${className}`}
      title="Click to inspect live incident intelligence"
    >
      {/* Tactical SVG Map & Drone Elevation Imagery */}
      <svg
        viewBox="0 0 500 280"
        className="w-full h-full object-cover select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c2340" />
            <stop offset="50%" stopColor="#0a3256" />
            <stop offset="100%" stopColor="#082038" />
          </linearGradient>
          <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>
          <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.15" />
          </pattern>
        </defs>

        {/* Base Terrain Background */}
        <rect width="500" height="280" fill="url(#floodGrad)" />
        <rect width="500" height="280" fill="url(#gridPattern)" />

        {/* River Contour & Flood Plains */}
        <path
          d="M 0,160 Q 120,130 220,170 T 380,150 T 500,200 L 500,280 L 0,280 Z"
          fill="url(#waterFlow)"
        />
        <path
          d="M 0,175 Q 140,155 240,190 T 400,170 T 500,225"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="6,4"
          className="animate-pulse"
        />

        {/* Submerged Settlements & Buildings */}
        <g stroke="#64748b" strokeWidth="1" fill="#1e293b" opacity="0.8">
          <rect x="80" y="110" width="35" height="25" rx="3" />
          <rect x="125" y="95" width="28" height="28" rx="3" />
          <rect x="70" y="80" width="24" height="20" rx="2" />

          {/* Flooded Cluster in Critical Zone */}
          <rect x="250" y="140" width="36" height="30" rx="3" fill="#334155" stroke="#ef4444" strokeWidth="1.5" />
          <rect x="295" y="150" width="40" height="26" rx="3" fill="#334155" stroke="#ef4444" strokeWidth="1.5" />
          <rect x="270" y="180" width="30" height="24" rx="3" fill="#334155" stroke="#ef4444" strokeWidth="1.5" />
        </g>

        {/* Blocked Road / Bridge (Amber warning) */}
        <path d="M 180,60 L 220,240" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8,4" strokeLinecap="round" />
        <circle cx="200" cy="150" r="14" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="200" y="154" fill="#fbbf24" fontSize="11" fontWeight="bold" textAnchor="middle">✕</text>

        {/* Critical Rescue Target Ring (12 people stranded) */}
        <g className="animate-pulse">
          <circle cx="285" cy="165" r="34" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
          <circle cx="285" cy="165" r="8" fill="#ef4444" />
          <circle cx="285" cy="165" r="3" fill="#ffffff" />
        </g>

        {/* Drone HUD Sight / Reticle */}
        <circle cx="285" cy="165" r="50" fill="none" stroke="#22d3ee" strokeWidth="0.75" strokeDasharray="10,6" />
        <path d="M 285,105 L 285,120 M 285,210 L 285,225 M 225,165 L 240,165 M 330,165 L 345,165" stroke="#22d3ee" strokeWidth="1.5" />

        {/* Rescue Team 02 Approach Vector */}
        <path d="M 110,60 Q 180,90 250,150" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5,4" />
        <circle cx="110" cy="60" r="6" fill="#10b981" />
        <text x="122" y="64" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">RESCUE-A (2.4 km)</text>

        {/* Scanlines / HUD overlays */}
        <line x1="20" y1="20" x2="60" y2="20" stroke="#22d3ee" strokeWidth="2" />
        <line x1="20" y1="20" x2="20" y2="60" stroke="#22d3ee" strokeWidth="2" />
        <line x1="480" y1="260" x2="440" y2="260" stroke="#22d3ee" strokeWidth="2" />
        <line x1="480" y1="260" x2="480" y2="220" stroke="#22d3ee" strokeWidth="2" />
      </svg>

      {/* Top HUD Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            🔴 CRITICAL FLOOD ZONE
          </span>
          <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
            DRONE-01 THERMAL HUD
          </span>
        </div>

        <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 text-[10px] font-mono">
          SIMULATED RECON FEED
        </span>
      </div>

      {/* Bottom HUD Telemetry Strip */}
      <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-[#071324]/90 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3 text-slate-200">
            <span className="text-red-400 font-bold flex items-center gap-1">
              👥 12 People Stranded
            </span>
            <span>•</span>
            <span className="text-amber-300">Water Depth: 1.4 m</span>
            <span>•</span>
            <span className="text-cyan-300">📡 Last Mesh Ping: 8s ago</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sector: Millbrook East Basin • Lat: 40.7128°N, Lon: 74.0060°W
          </p>
        </div>

        <button className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition group-hover:scale-105">
          Inspect Intelligence ➔
        </button>
      </div>
    </div>
  );
};

// "Why ResQMesh?" 3-Pillar Hackathon Value Proposition
export const WhyResQMeshBanner: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-[#071328] via-[#0b1a36] to-[#071328] border border-cyan-500/20 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            WHY RESQMESH MATTERS
          </span>
          <h2 className="text-base md:text-lg font-black text-white tracking-wide">
            Decentralized Mission Assurance When Cloud Infrastructure Dies
          </h2>
        </div>
        <span className="self-start md:self-auto text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-semibold">
          100% Zero-Cloud Autonomous
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20 space-y-2 hover:bg-white/[0.04] transition">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide font-mono">
            NO INTERNET?
          </h3>
          <p className="text-xs font-semibold text-white">
            WE STILL COORDINATE.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard laptops & radios form an ad-hoc local mesh. Field devices discover each other peer-to-peer without central cell towers.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-violet-500/20 space-y-2 hover:bg-white/[0.04] transition">
          <div className="w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-violet-300 uppercase tracking-wide font-mono">
            DEVICES DISCONNECTED?
          </h3>
          <p className="text-xs font-semibold text-white">
            MESSAGES WAIT AND SYNC.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Store-and-forward SQLite queues hold vital distress calls. When a node reconnects, pending messages flush idempotently with zero data loss.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-2 hover:bg-white/[0.04] transition">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide font-mono">
            AI RECOMMENDS?
          </h3>
          <p className="text-xs font-semibold text-white">
            HUMANS STAY IN CONTROL.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Local AI classifies priority, estimates travel time, and suggests rations. Life-safety dispatches always require explicit human authorization.
          </p>
        </div>
      </div>
    </div>
  );
};
