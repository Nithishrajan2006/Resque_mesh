import React from 'react';
import { 
  AlertTriangle, 
  Users, 
  LifeBuoy, 
  Boxes, 
  Play, 
  Network, 
  Radio, 
  ShieldAlert, 
  ExternalLink,
  Droplets,
  HeartPulse
} from 'lucide-react';
import { FloodAerialScene } from './DisasterVisuals';
import { DashboardStats, Incident } from '../types';
import { Maximize2, Sparkles, Eye, CheckCircle } from 'lucide-react';

interface DisasterHeroSectionProps {
  stats: DashboardStats | null;
  criticalCount: number;
  peopleNeedingHelp: number;
  activeTeamsCount: number;
  availableSuppliesCount: number;
  onRunSimulation: () => void;
  onExploreNetwork: () => void;
  onInspectSceneIncident: () => void;
  onInspectImage?: (id: string) => void;
}

export const DisasterHeroSection: React.FC<DisasterHeroSectionProps> = ({
  stats,
  criticalCount,
  peopleNeedingHelp,
  activeTeamsCount,
  availableSuppliesCount,
  onRunSimulation,
  onExploreNetwork,
  onInspectSceneIncident,
  onInspectImage,
}) => {
  const [heroVisualMode, setHeroVisualMode] = React.useState<'ai-drone' | 'vector' | 'blueprint'>('ai-drone');

  const handleInspectCurrent = () => {
    if (heroVisualMode === 'ai-drone' && onInspectImage) {
      onInspectImage('drone-recon');
    } else if (heroVisualMode === 'blueprint' && onInspectImage) {
      onInspectImage('problem-solution');
    } else {
      onInspectSceneIncident();
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#071328] via-[#091b36] to-[#050c18] border border-cyan-500/25 p-6 lg:p-8 shadow-2xl space-y-6">
      {/* Top Banner Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            🌊 ACTIVE DISASTER RESPONSE
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-mono text-cyan-300">
            Internet Unavailable — Local Rescue Network Operating
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            ZERO CLOUD MODE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
            Sector: Millbrook Valley Basin
          </span>
        </div>
      </div>

      {/* Main Split: Left Overview & Right Drone Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column (7 cols): Hero Title, Stats Chips & Action Buttons */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Flood Emergency — Millbrook Valley
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Rapid river cresting has severed regional cellular infrastructure. Local emergency devices and AI agents are actively coordinating field triage, water rescues, and supply drops over autonomous peer-to-peer mesh.
            </p>
          </div>

          {/* Core Emergency Numbers (Human-Friendly Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Critical Emergencies */}
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 space-y-1">
              <span className="text-[10px] uppercase font-mono text-red-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Critical Emergencies
              </span>
              <p className="text-2xl font-black text-red-300">{criticalCount || 1}</p>
              <p className="text-[10px] text-slate-400">Immediate threat</p>
            </div>

            {/* People Needing Help */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
              <span className="text-[10px] uppercase font-mono text-amber-400 font-bold flex items-center gap-1">
                <Users className="w-3 h-3" />
                People In Danger
              </span>
              <p className="text-2xl font-black text-amber-300">{peopleNeedingHelp || 39}</p>
              <p className="text-[10px] text-slate-400">Evacuations needed</p>
            </div>

            {/* Rescue Teams */}
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold flex items-center gap-1">
                <LifeBuoy className="w-3 h-3" />
                Rescue Missions
              </span>
              <p className="text-2xl font-black text-cyan-300">{stats?.active_tasks ?? 6}</p>
              <p className="text-[10px] text-slate-400">Active deployments</p>
            </div>

            {/* Supplies Available */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Boxes className="w-3 h-3" />
                Supplies Ready
              </span>
              <p className="text-2xl font-black text-emerald-300">
                {stats?.available_supply_units ? Math.round(stats.available_supply_units) : 8005}
              </p>
              <p className="text-[10px] text-slate-400">Water, food, medkits</p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onRunSimulation}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02] flex items-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RUN LIVE RESCUE SIMULATION</span>
            </button>

            <button
              onClick={onExploreNetwork}
              className="btn-secondary !text-sm !py-3 !px-5 border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center gap-2"
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Explore the Network</span>
            </button>

            {onInspectImage && (
              <button
                onClick={() => onInspectImage('problem-solution')}
                className="btn-secondary !text-sm !py-3 !px-4 border-violet-500/40 hover:border-violet-400 text-violet-300 flex items-center gap-2"
                title="View Problem & Solution Infographic"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Mission Blueprint</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Dynamic Visual Feed Switcher */}
        <div className="lg:col-span-5 space-y-2">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/[0.08] text-[11px] font-mono">
              <button
                onClick={() => setHeroVisualMode('ai-drone')}
                className={`px-2.5 py-1 rounded transition ${
                  heroVisualMode === 'ai-drone'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📷 AI Drone Recon
              </button>
              <button
                onClick={() => setHeroVisualMode('vector')}
                className={`px-2.5 py-1 rounded transition ${
                  heroVisualMode === 'vector'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📐 Vector HUD
              </button>
              <button
                onClick={() => setHeroVisualMode('blueprint')}
                className={`px-2.5 py-1 rounded transition ${
                  heroVisualMode === 'blueprint'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 Blueprint
              </button>
            </div>

            <button
              onClick={handleInspectCurrent}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs flex items-center gap-1 font-mono"
              title="Inspect Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Inspect</span>
            </button>
          </div>

          {/* Visual Container */}
          {heroVisualMode === 'ai-drone' ? (
            <div
              onClick={handleInspectCurrent}
              className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#061224] group cursor-pointer shadow-xl h-64 sm:h-72 w-full transition-all duration-300 hover:border-cyan-400 hover:shadow-cyan-500/20"
            >
              <img
                src="/images/drone-recon-hud.jpg"
                alt="AI Drone Aerial Reconnaissance"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Top HUD Badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-mono font-bold animate-pulse backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  🔴 THERMAL DETECT: 12 STRANDED
                </span>
                <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                  DRONE-01 RECON
                </span>
              </div>

              {/* Bottom HUD Telemetry Strip */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2.5 rounded-xl bg-[#071324]/90 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-200 text-[11px]">
                    <span className="text-amber-300 font-bold">Depth: 1.4m</span>
                    <span>•</span>
                    <span className="text-cyan-300">Alt: 31m</span>
                    <span>•</span>
                    <span className="text-emerald-300">Route: Safe</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Millbrook East Basin • P2P Mesh Ping: 8ms
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px] shadow">
                  Inspect ➔
                </span>
              </div>
            </div>
          ) : heroVisualMode === 'blueprint' ? (
            <div
              onClick={handleInspectCurrent}
              className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#061224] group cursor-pointer shadow-xl h-64 sm:h-72 w-full transition-all duration-300 hover:border-emerald-400 hover:shadow-emerald-500/20"
            >
              <img
                src="/images/resqmesh-problem-solution.jpg"
                alt="ResQMesh Problem vs Solution"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <div className="w-full flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 font-bold text-[11px]">
                    1. Local ➔ 2. Coordinate ➔ 3. Sync
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px]">
                    Expand ➔
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <FloodAerialScene onInspect={onInspectSceneIncident} className="h-64 sm:h-72 w-full" />
          )}
        </div>
      </div>
    </div>
  );
};
