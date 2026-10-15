import React, { useState } from 'react';
import { 
  X, 
  Play, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Cpu, 
  UserCheck, 
  Boxes, 
  WifiOff, 
  Radio, 
  Wifi, 
  CopyCheck, 
  CheckCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { simulateStep, getWorkflowDescription } from '../lib/api';

interface DemoWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowComplete?: () => void;
}

const STEP_ICONS = [
  Radio,          // Step 1: Report flood
  Cpu,            // Step 2: Incident Agent
  Sparkles,       // Step 3: Task Agent propose
  UserCheck,      // Step 4: Human Approval
  Boxes,          // Step 5: Supply Agent
  WifiOff,        // Step 6: Disconnect peer
  Radio,          // Step 7: Multi-hop forward
  Wifi,           // Step 8: Reconnect & sync
  CopyCheck,      // Step 9: Duplicate detection
  CheckCheck,     // Step 10: Dashboard complete
];

export const DemoWorkflowModal: React.FC<DemoWorkflowModalProps> = ({
  isOpen,
  onClose,
  onWorkflowComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepResults, setStepResults] = useState<Record<number, any>>({});
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const STEP_LOGS: Record<number, string[]> = {
    1: ['12:31:04 INCIDENT_CREATED — Flash flood reported by RESCUE-A in Riverside District'],
    2: ['12:31:05 AI_ANALYSIS_STARTED — Local IncidentAgent keyword scanning', '12:31:06 SEVERITY_CRITICAL — Scored 0.95 priority rating'],
    3: ['12:31:07 MESH_BROADCAST — AI proposed water rescue task (AWAITING HUMAN APPROVAL)'],
    4: ['12:31:22 HUMAN_APPROVAL — Commander Davis authorized rescue dispatch', '12:31:24 TASK_DISPATCHED — Assigned to RESCUE-A zodiac unit'],
    5: ['12:31:18 SUPPLY_RECOMMENDATION — 400L drinking water allocated from Central Depot (20% safety buffer preserved)'],
    6: ['12:31:08 RESCUE-B_OFFLINE — Field unit radio partition detected', '12:31:09 MESSAGE_QUEUED — Stored in local store-and-forward SQLite bus'],
    7: ['12:31:11 MESSAGE_HOP_FORWARDED — Relayed via intermediate peer RESCUE-A (Hop 1/5)'],
    8: ['12:31:15 RESCUE-B_ONLINE — Radio link re-established', '12:31:16 MESSAGE_SYNCED — Queued packets delivered & acknowledged'],
    9: ['12:31:17 DUPLICATE_SUPPRESSION — Retransmitted packet rejected via SHA-256 checksum'],
    10: ['12:31:20 CONVERGENCE_ACHIEVED — All 4 nodes synchronized across local mesh with 100% data integrity'],
  };

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Incident Reported via Mesh Device',
      desc: 'Rescue Alpha node transmits a critical flood report in Riverside District over local peer network.',
      tag: 'Edge Sensor / Mesh Packet',
    },
    {
      num: 2,
      title: 'Incident Agent Offline Evaluation',
      desc: 'Rule-based local agent validates keyword triggers ("trapped", "flooding"), computes priority score (100+), flags immediate dispatch.',
      tag: 'Local Agent Intelligence',
    },
    {
      num: 3,
      title: 'Task Agent Proposes Rescue Operation',
      desc: 'Task Agent matches capabilities to flood evacuation. Suggests team "Rescue Alpha". Marks "HUMAN APPROVAL REQUIRED".',
      tag: 'Human-in-the-Loop Guardrail',
    },
    {
      num: 4,
      title: 'Human Commander Approves Dispatch',
      desc: 'Authorized operator reviews explainable AI recommendation and signs off. Task transitions to Assigned.',
      tag: 'Safety Verification',
    },
    {
      num: 5,
      title: 'Supply Agent Resource Allocation',
      desc: 'Calculates stock via transaction ledger (not overwrite). Allocates water and rations while enforcing safety reserves.',
      tag: 'Supply Safety Check',
    },
    {
      num: 6,
      title: 'Peer Network Partition Simulation',
      desc: 'Simulates field radio dropout: Rescue Bravo goes offline. Outgoing incident updates are safely queued in persistent local store.',
      tag: 'Store-and-Forward Queue',
    },
    {
      num: 7,
      title: 'Multi-Hop Mesh Forwarding',
      desc: 'Packet routes through reachable intermediate node (Rescue Alpha). Hop count increments; routing loops prevented.',
      tag: 'Decentralized Routing',
    },
    {
      num: 8,
      title: 'Peer Reconnection & Synchronized Catchup',
      desc: 'Rescue Bravo reconnects. Pending queue flushes idempotently. Ack packets exchanged and delivery timestamps confirmed.',
      tag: 'Eventual Consistency',
    },
    {
      num: 9,
      title: 'Duplicate Suppression & Conflict Shield',
      desc: 'Identical message arrives via secondary path. Checksum deduplication silently drops duplicate with zero state corruption.',
      tag: 'Data Integrity',
    },
    {
      num: 10,
      title: 'System Wide Convergence & Telemetry',
      desc: 'Map markers, audit logs, inventory gauges, and command dashboard reach 100% verified state without cloud dependencies.',
      tag: 'Zero Cloud Autonomy',
    },
  ];

  const executeStep = async (stepNum: number) => {
    setIsRunning(true);
    setStepError(null);
    try {
      const res = await simulateStep(stepNum);
      setStepResults((prev) => ({ ...prev, [stepNum]: res.data }));
      setCurrentStep(stepNum);
      if (STEP_LOGS[stepNum]) {
        setSimulationLogs((prev) => [...prev, ...STEP_LOGS[stepNum]]);
      }
      if (stepNum === 10 && onWorkflowComplete) {
        onWorkflowComplete();
      }
    } catch (err: any) {
      setStepError(err.response?.data?.detail || err.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const runAllSteps = async () => {
    setIsRunning(true);
    setStepError(null);
    for (let i = 1; i <= 10; i++) {
      try {
        const res = await simulateStep(i);
        setStepResults((prev) => ({ ...prev, [i]: res.data }));
        setCurrentStep(i);
        if (STEP_LOGS[i]) {
          setSimulationLogs((prev) => [...prev, ...STEP_LOGS[i]]);
        }
        // Small delay so audience sees progression
        await new Promise((r) => setTimeout(r, 650));
      } catch (err: any) {
        setStepError(`Failed at Step ${i}: ` + (err.response?.data?.detail || err.message));
        setIsRunning(false);
        return;
      }
    }
    setIsRunning(false);
    if (onWorkflowComplete) onWorkflowComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full bg-[#0a1526]/95 border-cyan-500/30 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                10-Step E2E Disaster Response Workflow
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Interactive Live Demo
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates local AI agents, mesh store-and-forward, human approval, and offline sync.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Live State Strip During Simulation */}
        <div className="px-6 py-2.5 bg-black/40 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Mesh Peer States:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RESCUE-A: ONLINE
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-300 ${
                  currentStep >= 6 && currentStep < 8
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {currentStep >= 6 && currentStep < 8 ? 'RESCUE-B: OFFLINE (QUEUE ACTIVE)' : 'RESCUE-B: ONLINE'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DRONE-01: ONLINE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SUPPLY-C: ONLINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-400">Simulation Progress:</span>
            <span className="text-cyan-400 font-bold">{Math.round((currentStep / 10) * 100)}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Content Body: Split Left (Steps) and Right (Live Log Output) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Steps List */}
          <div className="lg:col-span-7 space-y-2.5">
            {steps.map((st) => {
              const Icon = STEP_ICONS[st.num - 1];
              const isDone = currentStep >= st.num;
              const isCurrent = currentStep + 1 === st.num;

              return (
                <div
                  key={st.num}
                  className={`p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                    isDone
                      ? 'bg-cyan-500/[0.08] border-cyan-500/40'
                      : isCurrent
                      ? 'bg-white/[0.06] border-white/20 ring-1 ring-cyan-500/50'
                      : 'bg-white/[0.02] border-white/[0.05] opacity-60'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Step {st.num}: {st.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400">
                        {st.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                  </div>

                  {isCurrent && (
                    <button
                      onClick={() => executeStep(st.num)}
                      disabled={isRunning}
                      className="btn-primary !text-[11px] !py-1 !px-2.5 shrink-0 self-center"
                    >
                      Run Step
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Step Telemetry Log */}
          <div className="lg:col-span-5 flex flex-col bg-black/40 rounded-xl border border-white/[0.08] p-4 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                Execution Telemetry
              </span>
              <span className="text-cyan-400 font-bold">
                Progress: {currentStep} / 10
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {currentStep === 0 && (
                <div className="text-slate-500 italic text-center py-10">
                  Ready. Click "Run Full Workflow Auto" or execute Step 1.
                </div>
              )}

              {/* Live Mesh Event Sequence Stream */}
              {simulationLogs.length > 0 && (
                <div className="p-3 rounded-lg bg-black/60 border border-cyan-500/30 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08] text-[10px] text-cyan-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      SIMULATED EVENT LOG
                    </span>
                    <span className="text-slate-500">{simulationLogs.length} events emitted</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[10px]">
                    {simulationLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-cyan-400 select-none">›</span>
                        <span className={
                          log.includes('CRITICAL') || log.includes('OFFLINE')
                            ? 'text-red-400 font-bold'
                            : log.includes('AI_') || log.includes('SUPPLY_')
                            ? 'text-violet-300 font-semibold'
                            : log.includes('ONLINE') || log.includes('SYNCED') || log.includes('APPROVAL') || log.includes('CONVERGENCE')
                            ? 'text-emerald-400 font-bold'
                            : 'text-slate-300'
                        }>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(stepResults).map(([stepKey, res]) => (
                <div key={stepKey} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Step {stepKey} Success</span>
                  </div>
                  <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(res, null, 2)}
                  </pre>
                </div>
              ))}

              {stepError && (
                <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Error Detected
                  </div>
                  <p className="text-[11px]">{stepError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#071120] flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentStep(0);
              setStepResults({});
              setSimulationLogs([]);
              setStepError(null);
            }}
            className="btn-secondary !text-xs"
            disabled={isRunning}
          >
            Reset Workflow State
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={runAllSteps}
              disabled={isRunning || currentStep === 10}
              className="btn-primary !text-xs bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-slate-950 font-bold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Simulating Mesh...' : 'Run Full Workflow Auto'}</span>
            </button>
            <button onClick={onClose} className="btn-secondary !text-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
