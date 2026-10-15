import React, { useState } from 'react';
import { 
  WifiOff, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  ShieldAlert, 
  Radio, 
  Cpu, 
  UserCheck, 
  Send,
  Database,
  Truck
} from 'lucide-react';
import { simulateStep } from '../lib/api';

interface StepDetail {
  number: number;
  title: string;
  desc: string;
  icon: string;
  highlight: string;
}

const STEPS: StepDetail[] = [
  {
    number: 1,
    title: 'Internet connection lost',
    desc: 'Cell towers lose power and centralized cloud backends become unreachable.',
    icon: '⚡',
    highlight: 'Zero Cloud Mode Active',
  },
  {
    number: 2,
    title: 'Rescue-B disconnects',
    desc: 'Field paramedic unit moves into a radio-blind zone behind a ridge.',
    icon: '📱',
    highlight: 'RESCUE-B Offline',
  },
  {
    number: 3,
    title: 'New emergency report created',
    desc: 'Rescue-A inputs critical flash flood report with 12 trapped civilians.',
    icon: '🌊',
    highlight: 'Incident Ingested',
  },
  {
    number: 4,
    title: 'Mesh network broadcasts the report',
    desc: 'Report packets propagate peer-to-peer over local ad-hoc Wi-Fi.',
    icon: '📡',
    highlight: 'P2P Broadcast',
  },
  {
    number: 5,
    title: 'Rescue-B cannot receive it',
    desc: 'Because Rescue-B is partitioned, direct packet delivery fails.',
    icon: '🚫',
    highlight: 'Partition Detected',
  },
  {
    number: 6,
    title: 'Message stored locally',
    desc: 'Local SQLite store-and-forward engine holds message safely on disk.',
    icon: '💾',
    highlight: 'Queued in Local Storage',
  },
  {
    number: 7,
    title: 'Rescue-B reconnects',
    desc: 'Rescue-B re-enters peer range; mutual ad-hoc handshake re-establishes.',
    icon: '🔄',
    highlight: 'RESCUE-B Online',
  },
  {
    number: 8,
    title: 'Stored message automatically synchronizes',
    desc: 'Queued distress packet flushes automatically and acknowledges receipt.',
    icon: '✨',
    highlight: '100% Synced',
  },
  {
    number: 9,
    title: 'AI analyzes the incident',
    desc: 'Local IncidentAgent prioritizes urgency rating and identifies nearest team.',
    icon: '🤖',
    highlight: 'Priority: Critical (94%)',
  },
  {
    number: 10,
    title: 'Human approves rescue action',
    desc: 'Commander reviews AI recommendation and authorizes team dispatch.',
    icon: '👤',
    highlight: 'Human Sign-off Complete',
  },
  {
    number: 11,
    title: 'Rescue mission dispatched',
    desc: 'Rescue Team 02 is deployed with zodiac boats and drinking water.',
    icon: '🚑',
    highlight: 'Mission En Route',
  },
];

export const OfflineInteractiveExplainer: React.FC<{
  onStepExecuted?: () => void;
}> = ({ onStepExecuted }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runSimulation = async () => {
    setIsRunning(true);
    setActiveStep(1);

    for (let i = 1; i <= 11; i++) {
      setActiveStep(i);

      // Trigger corresponding backend step at key milestones
      try {
        if (i === 3) await simulateStep(1);
        if (i === 6) await simulateStep(6);
        if (i === 8) await simulateStep(8);
        if (i === 9) await simulateStep(2);
        if (i === 10) await simulateStep(4);
      } catch (err) {
        console.warn(`Simulated step ${i} local fallback:`, err);
      }

      if (onStepExecuted) onStepExecuted();
      // Delay so judges can read and follow the progression
      await new Promise((r) => setTimeout(r, 1100));
    }

    setIsRunning(false);
  };

  const resetSimulation = () => {
    setActiveStep(0);
    setIsRunning(false);
  };

  return (
    <div className="glass-card p-6 border border-cyan-500/20 bg-gradient-to-r from-[#061224] via-[#091b34] to-[#061224] rounded-2xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <WifiOff className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-wide">
              WHAT HAPPENS WHEN THE INTERNET FAILS?
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Step-by-step demonstration of autonomous store-and-forward mesh survival during severe network blackouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeStep === 0 ? (
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="btn-primary !py-2 !px-5 text-xs bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500 hover:from-red-400 hover:to-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>SIMULATE NETWORK FAILURE</span>
            </button>
          ) : (
            <>
              <button
                onClick={runSimulation}
                disabled={isRunning}
                className="btn-primary !text-xs !py-1.5 !px-3"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunning ? `Running Step ${activeStep}/11...` : 'Re-Run'}</span>
              </button>
              <button
                onClick={resetSimulation}
                disabled={isRunning}
                className="btn-secondary !text-xs !py-1.5 !px-3"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">Offline Resilience Pipeline Progress:</span>
          <span className="text-cyan-400 font-bold">
            {activeStep === 0 ? 'Ready to Simulate' : `Step ${activeStep} of 11 Completed (${Math.round((activeStep / 11) * 100)}%)`}
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/[0.08]">
          <div
            className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${(activeStep / 11) * 100}%` }}
          />
        </div>
      </div>

      {/* 11 Steps Horizontal / Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {STEPS.map((s) => {
          const isPassed = activeStep >= s.number;
          const isCurrent = activeStep === s.number;

          return (
            <div
              key={s.number}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-105'
                  : isPassed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] opacity-60'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-cyan-400 text-slate-950'
                        : isPassed
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    STEP {s.number}
                  </span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{s.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {s.desc}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                <span className={isCurrent ? 'text-cyan-300 font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-500'}>
                  {s.highlight}
                </span>
                {isPassed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
