import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Radio, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  WifiOff,
  Boxes,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { simulateStep, loadDemo } from '../lib/api';

interface DemoStep {
  step: number;
  title: string;
  category: string;
  actor: string;
  description: string;
  backendStepMapping?: number;
}

const DEMO_STEPS: DemoStep[] = [
  { step: 1, title: 'Drone detects flooding', category: 'SURVEILLANCE', actor: 'DRONE-01', description: 'Drone Recon-01 infrared sensors identify rapid water rise exceeding 1.2 meters in Riverside District.' },
  { step: 2, title: 'Incident created', category: 'EDGE INGESTION', actor: 'RESCUE-A', description: 'Rescue Alpha logs critical flood emergency: 12 civilians stranded on residential rooftops.', backendStepMapping: 1 },
  { step: 3, title: 'AI classifies as critical', category: 'LOCAL AI', actor: 'IncidentAgent', description: 'Rule-based agent detects keyword threats ("trapped", "flood") and assigns a 0.95 urgency priority.', backendStepMapping: 2 },
  { step: 4, title: 'Rescue-A broadcasts report', category: 'MESH BUS', actor: 'RESCUE-A', description: 'Distress packet broadcast across local 802.11s ad-hoc mesh with SHA-256 cryptographic checksum.', backendStepMapping: 3 },
  { step: 5, title: 'Rescue-B goes offline', category: 'PARTITION', actor: 'RESCUE-B', description: 'Rescue Bravo moves into a ravine and temporarily loses radio line-of-sight. Node marked offline.', backendStepMapping: 6 },
  { step: 6, title: 'Message is stored', category: 'STORE & FORWARD', actor: 'Local SQLite Bus', description: 'Packet cannot reach Rescue-B directly; it is safely held in the persistent store-and-forward queue.' },
  { step: 7, title: 'Supply-C reports available water', category: 'LOGISTICS', actor: 'SUPPLY-C', description: 'Supply Depot Charlie audits local ledger: 5,000L drinking water confirmed on site.' },
  { step: 8, title: 'AI recommends allocation', category: 'LOCAL AI', actor: 'SupplyAgent', description: 'SupplyAgent calculates 500L water needed for 12 civilians while strictly preserving 20% safety baseline.' },
  { step: 9, title: 'Rescue-B reconnects', category: 'RECOVERY', actor: 'RESCUE-B', description: 'Rescue Bravo climbs ridge. Radio link re-establishes; peer handshake completes.', backendStepMapping: 8 },
  { step: 10, title: 'Message synchronizes', category: 'CONVERGENCE', actor: 'SyncEngine', description: 'Queued distress call delivered to Rescue-B idempotently. Ack receipt timestamped.' },
  { step: 11, title: 'AI recommends Rescue Team 02', category: 'LOCAL AI', actor: 'TaskCoordAgent', description: 'Task agent pairs amphibious zodiac team (Rescue Team 02) with 2.4 km proximity vector.' },
  { step: 12, title: 'Human approves', category: 'SAFETY GUARDRAIL', actor: 'Commander Davis', description: 'Human incident commander reviews AI recommendations and authorizes rescue and supply dispatch.', backendStepMapping: 4 },
  { step: 13, title: 'Mission dispatched', category: 'EXECUTION', actor: 'RESCUE-A', description: 'Rescue Mission 014 status transitions to DISPATCHED. Team moves out.' },
  { step: 14, title: 'Map shows route', category: 'SPATIAL HUD', actor: 'DisasterMap', description: 'Tactical route vector rendered between North Staging Base and Millbrook flood sector.' },
  { step: 15, title: 'Inventory decreases', category: 'LEDGER', actor: 'SupplyLedger', description: '500L water deducted in append-only ledger transaction (ai_suggested=true, human_approved=true).', backendStepMapping: 5 },
  { step: 16, title: 'Audit log records actions', category: 'COMPLIANCE', actor: 'AuditService', description: 'Cryptographic immutable audit record logged with operator signature and timestamp.' },
  { step: 17, title: 'Dashboard updates', category: 'FINAL STATE', actor: 'ResQMesh HQ', description: 'All 4 mesh nodes, inventory gauges, and command KPIs synchronize with zero cloud dependencies.', backendStepMapping: 10 },
];

export const TwoMinuteDemoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const stepRef = useRef<number>(0);
  stepRef.current = currentStep;

  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const isRunningRef = useRef<boolean>(false);
  isRunningRef.current = isRunning;

  // Run a single step
  const executeStepLogic = async (stepNum: number) => {
    setCurrentStep(stepNum);
    const stepConfig = DEMO_STEPS[stepNum - 1];

    if (stepConfig?.backendStepMapping) {
      try {
        await simulateStep(stepConfig.backendStepMapping);
      } catch (err) {
        console.warn(`Simulated backend step ${stepConfig.backendStepMapping} note:`, err);
      }
    }
  };

  const startDemo = async () => {
    setIsRunning(true);
    setIsPaused(false);

    // If starting from 0, reload clean demo state
    if (stepRef.current === 0) {
      try {
        await loadDemo();
      } catch (e) {
        console.warn('Demo initial load fallback:', e);
      }
    }

    runLoop(stepRef.current > 0 ? stepRef.current : 1);
  };

  const runLoop = async (fromStep: number) => {
    for (let s = fromStep; s <= 17; s++) {
      if (!isRunningRef.current || isPausedRef.current) break;
      await executeStepLogic(s);

      // 1.8 seconds per step so judges can absorb the story
      await new Promise((r) => setTimeout(r, 1800));

      if (s === 17) {
        setIsRunning(false);
        setIsPaused(false);
        if (onComplete) onComplete();
      }
    }
  };

  const pauseDemo = () => {
    setIsPaused(true);
  };

  const resumeDemo = () => {
    setIsPaused(false);
    runLoop(stepRef.current + 1);
  };

  const resetDemoWorkflow = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    try {
      await loadDemo();
      if (onComplete) onComplete();
    } catch (e) {
      console.warn('Demo reset note:', e);
    }
  };

  if (!isOpen) return null;

  const activeStepData = currentStep > 0 ? DEMO_STEPS[currentStep - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-4xl w-full bg-[#071328]/95 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] bg-[#091b36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  2-MINUTE HACKATHON LIVE DEMO
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  AUTONOMOUS DISASTER FLOW
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Full end-to-end disaster scenario: Drone detection → Mesh broadcast → Store-and-forward → AI recommendation → Human approval → Mission dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Progress Indicator Banner */}
        <div className="p-4 bg-[#050c18] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-300">
              PROGRESS: <strong className="text-cyan-300">{currentStep === 0 ? 'READY' : `DEMO STEP ${currentStep} / 17`}</strong>
            </span>
          </div>

          <div className="w-48 sm:w-80 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/[0.08]">
            <div
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 17) * 100}%` }}
            />
          </div>

          <span className="text-cyan-400 font-bold">
            {Math.round((currentStep / 17) * 100)}%
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Step Spotlight Card */}
          {activeStepData ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent border border-cyan-500/30 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  STEP {activeStepData.step} • {activeStepData.category}
                </span>
                <span className="text-slate-400">
                  Executing Actor: <strong className="text-white">{activeStepData.actor}</strong>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-cyan-400 shrink-0" />
                {activeStepData.title}
              </h3>

              <p className="text-sm text-slate-200 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/[0.06]">
                {activeStepData.description}
              </p>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.1] p-6">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-white">
                Ready to demonstrate ResQMesh to judges?
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong>"Start 2-Minute Demo"</strong> to run the automated 17-step disaster response scenario. Watch the mesh network, AI agents, and inventory update live without cloud connection!
              </p>
            </div>
          )}

          {/* Stepper Timeline Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              17-Step Scenario Sequence:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
              {DEMO_STEPS.map((s) => {
                const isCurrent = currentStep === s.step;
                const isDone = currentStep > s.step;

                return (
                  <div
                    key={s.step}
                    onClick={() => executeStepLogic(s.step)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                        : isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {s.step}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </div>

                    {isDone && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-white/[0.08] bg-[#091b36] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={resetDemoWorkflow}
            className="btn-secondary !text-xs !py-2 !px-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scenario</span>
          </button>

          <div className="flex items-center gap-2.5">
            {!isRunning ? (
              <button
                onClick={startDemo}
                className="btn-primary !text-xs !py-2 !px-5 bg-gradient-to-r from-cyan-500 to-teal-400 font-bold shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{currentStep === 0 ? 'Start 2-Minute Demo' : 'Restart Demo'}</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={resumeDemo}
                className="btn-primary !text-xs !py-2 !px-5 bg-emerald-500 hover:bg-emerald-400 font-bold"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Demo</span>
              </button>
            ) : (
              <button
                onClick={pauseDemo}
                className="btn-secondary !text-xs !py-2 !px-5 border-amber-500/40 text-amber-300"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Demo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-secondary !text-xs !py-2 !px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
