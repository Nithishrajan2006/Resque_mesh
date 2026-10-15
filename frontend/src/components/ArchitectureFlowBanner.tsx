import React, { useState } from 'react';
import { 
  Radio, 
  Network, 
  HardDrive, 
  Cpu, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  X
} from 'lucide-react';

export const ArchitectureFlowBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 py-1 px-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 transition"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Show Offline Mesh Architecture Diagram</span>
      </button>
    );
  }

  const nodes = [
    {
      title: 'FIELD DEVICES',
      subtitle: 'RESCUE-A, B, DRONE-01',
      icon: Radio,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      title: 'LOCAL PEER NETWORK',
      subtitle: 'Ad-hoc Wi-Fi / LoRa SIM',
      icon: Network,
      color: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
    },
    {
      title: 'STORE & FORWARD',
      subtitle: 'Offline Queues & SHA-256',
      icon: HardDrive,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
      title: 'LOCAL AI AGENTS',
      subtitle: 'Deterministic Edge Scoring',
      icon: Cpu,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      title: 'LOCAL INCIDENT COMMAND',
      subtitle: 'Human-in-the-Loop Sign-off',
      icon: ShieldCheck,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
  ];

  return (
    <div className="glass-card p-4 border border-cyan-500/20 bg-gradient-to-r from-[#07152b] via-[#091b36] to-[#07152b] shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase font-mono text-cyan-300">
            Decentralized Architecture Flow — 100% Offline Coordination
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            ZERO CLOUD SERVERS • LOCAL EDGE SIMULATION
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/[0.05]"
          title="Minimize Architecture Banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-2 lg:gap-3">
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={node.title}>
              <div className="flex-1 w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition">
                <div className={`p-2 rounded-lg border shrink-0 ${node.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 tracking-wide font-mono truncate">
                    {node.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {node.subtitle}
                  </div>
                </div>
              </div>

              {idx < nodes.length - 1 && (
                <div className="hidden md:flex text-slate-600 shrink-0">
                  <ChevronRight className="w-4 h-4 text-cyan-500/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>
          <strong className="text-cyan-300">Resilience Guarantee:</strong> When internet backbones fail, field nodes synchronize peer-to-peer via store-and-forward queues.
        </span>
        <span className="text-slate-500 hidden sm:inline">
          Local SQLite Ledger • Deterministic Fallbacks
        </span>
      </div>
    </div>
  );
};
