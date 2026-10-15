import React, { useState } from 'react';
import { Plane, AlertTriangle, Eye, ShieldAlert, Cpu, Radio, RefreshCw } from 'lucide-react';

export const FieldIntelligenceCard: React.FC<{
  onInspectTarget?: () => void;
}> = ({ onInspectTarget }) => {
  const [thermalMode, setThermalMode] = useState<boolean>(false);

  return (
    <div className="glass-card p-5 border border-cyan-500/20 bg-[#071328] space-y-4 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30">
            <Plane className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              FIELD INTELLIGENCE
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              DRONE-01 • Sector East Aerial Reconnaissance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setThermalMode(!thermalMode)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition border ${
              thermalMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            {thermalMode ? '🔥 THERMAL ON' : '📷 OPTICAL HD'}
          </button>
          <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold">
            SIMULATED DRONE FEED
          </span>
        </div>
      </div>

      {/* Main Drone HUD Screen */}
      <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-[#040b17] h-60">
        <svg
          viewBox="0 0 460 240"
          className="w-full h-full object-cover select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="droneFeedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={thermalMode ? '#450a0a' : '#07172c'} />
              <stop offset="50%" stopColor={thermalMode ? '#7f1d1d' : '#0c2747'} />
              <stop offset="100%" stopColor={thermalMode ? '#991b1b' : '#081c33'} />
            </linearGradient>
            <radialGradient id="thermalHeat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.7" />
              <stop offset="80%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Terrain */}
          <rect width="460" height="240" fill="url(#droneFeedGrad)" />

          {/* Flooded Basin Silhouette */}
          <path
            d="M 0,130 Q 150,110 230,140 T 380,120 T 460,170 L 460,240 L 0,240 Z"
            fill={thermalMode ? '#1e1b4b' : '#0284c7'}
            fillOpacity={thermalMode ? '0.6' : '0.4'}
          />

          {/* Heat Signatures / Trapped Citizens Cluster */}
          {thermalMode ? (
            <g>
              <circle cx="230" cy="130" r="38" fill="url(#thermalHeat)" />
              <circle cx="220" cy="125" r="8" fill="#ffffff" />
              <circle cx="235" cy="120" r="7" fill="#ffffff" />
              <circle cx="240" cy="135" r="8" fill="#ffffff" />
            </g>
          ) : (
            <g stroke="#38bdf8" strokeWidth="1" fill="#0f172a">
              <rect x="200" y="110" width="55" height="40" rx="3" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
              <text x="227" y="135" fill="#fca5a5" fontSize="10" textAnchor="middle" fontWeight="bold">ROOFTOP</text>
            </g>
          )}

          {/* Tactical Crosshairs & Elevation Markers */}
          <g stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.7">
            <line x1="230" y1="20" x2="230" y2="70" />
            <line x1="230" y1="190" x2="230" y2="220" />
            <line x1="40" y1="130" x2="110" y2="130" />
            <line x1="350" y1="130" x2="420" y2="130" />
            <circle cx="230" cy="130" r="28" fill="none" strokeDasharray="4,3" />
          </g>

          {/* Artificial Horizon Pitch Ladder */}
          <g stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4">
            <line x1="190" y1="100" x2="270" y2="100" />
            <line x1="200" y1="85" x2="260" y2="85" />
            <line x1="200" y1="115" x2="260" y2="115" />
          </g>
        </svg>

        {/* Live HUD Floating Overlays */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-cyan-300 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
            ALT: 120m • HDG: 042° • BAT: 68%
          </span>
          <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-emerald-400">
            GPS: LOCAL COORD SYNCED
          </span>
        </div>

        {/* Center Target Box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border border-red-500/60 w-32 h-24 rounded-lg bg-red-500/5 animate-pulse flex flex-col justify-between p-1.5 text-[9px] font-mono text-red-300">
            <span>TARGET ACQUIRED</span>
            <span className="self-end">12 CIVILIANS</span>
          </div>
        </div>

        {/* Bottom HUD Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-lg bg-black/75 backdrop-blur-md border border-white/[0.08] text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-200">
            <span className="text-cyan-400 font-bold">Flood Depth: 1.2 m</span>
            <span>•</span>
            <span className="text-amber-300">Visibility: Moderate</span>
            <span>•</span>
            <span className="text-red-400 font-bold">People Detected: 12</span>
          </div>
          <button
            onClick={onInspectTarget}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold"
          >
            Open Dossier
          </button>
        </div>
      </div>

      {/* AI Field Observation Callout */}
      <div className="p-3 rounded-xl bg-violet-500/[0.08] border border-violet-500/20 flex items-start gap-3">
        <div className="p-1 rounded bg-violet-500/20 text-violet-300 shrink-0 mt-0.5">
          <Cpu className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5 text-xs">
          <span className="font-mono text-[10px] uppercase font-bold text-violet-300">
            AI Aerial Observation (IncidentAgent)
          </span>
          <p className="text-slate-300 leading-snug">
            "Evacuation route on the eastern road appears unsafe due to rapid current and structural erosion. Recommend dispatching amphibious Rescue Team 02 via northern backchannel."
          </p>
        </div>
      </div>
    </div>
  );
};
