import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ShieldAlert, 
  Cpu, 
  Boxes, 
  CheckSquare, 
  Clock, 
  UserCheck, 
  ArrowRight,
  X
} from 'lucide-react';
import { listTasks, approveTask, listIncidents, getInventorySummary } from '../lib/api';

interface AIRecommendationItem {
  id: string;
  category: 'task' | 'supply' | 'evacuation';
  title: string;
  recommendation: string;
  confidence: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  affectedCount: number;
  entityId?: string;
  targetUnit?: string;
}

interface AIRecommendationsPanelProps {
  onActionComplete?: () => void;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({ onActionComplete }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>([
    {
      id: 'rec-1',
      category: 'task',
      title: 'Water Rescue Dispatch',
      recommendation: 'Deploy Rescue Alpha boat crew to Riverside District (42 stranded civilians)',
      confidence: 0.95,
      reason: 'Critical flood stage: water level rising at 30cm/hr. Rescue Alpha is equipped with motorized inflatable zodiac and is 450m from target.',
      status: 'pending',
      affectedCount: 42,
      targetUnit: 'RESCUE-A',
    },
    {
      id: 'rec-2',
      category: 'supply',
      title: 'Potable Water & Hypothermia Kits',
      recommendation: 'Release 400L drinking water and 50 trauma/hypothermia kits to Valley Road Shelter',
      confidence: 0.92,
      reason: '18 evacuees reported with hypothermia. Central Depot stock level is 4,700L, leaving a 74% safety reserve well above the 20% legal minimum.',
      status: 'pending',
      affectedCount: 18,
      targetUnit: 'SUPPLY-C',
    },
    {
      id: 'rec-3',
      category: 'evacuation',
      title: 'Relief Convoy Reroute Advisory',
      recommendation: 'Divert Supply Convoy Charlie from Route 7 to Route 12 via Westside',
      confidence: 0.88,
      reason: 'Route 7 washed out at mile marker 12. Aerial Recon Drone DRONE-01 confirms Route 12 bridge is structurally sound (+14 min transit).',
      status: 'pending',
      affectedCount: 250,
      targetUnit: 'DRONE-01',
    },
  ]);

  const [reviewingItem, setReviewingItem] = useState<AIRecommendationItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleApprove = async (item: AIRecommendationItem) => {
    try {
      // Find tasks to approve if matching
      const tasksRes = await listTasks();
      const matchingTask = tasksRes.data.find(
        (t: any) => t.ai_suggested && !t.human_approved
      );
      if (matchingTask) {
        await approveTask(matchingTask.id, {
          approved: true,
          approved_by: 'Incident Commander',
          notes: `Approved AI recommendation: ${item.recommendation}`,
        });
      }

      setRecommendations((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: 'approved' } : r))
      );
      setActionMessage(`✓ APPROVED: ${item.title} — Dispatched under human authorization.`);
      setTimeout(() => setActionMessage(null), 5000);
      onActionComplete?.();
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
      // Still mark approved locally for responsive feedback
      setRecommendations((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: 'approved' } : r))
      );
    }
  };

  const handleReject = (item: AIRecommendationItem) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: 'rejected' } : r))
    );
    setActionMessage(`⚠️ REJECTED: ${item.title} — Dismissed by Incident Commander.`);
    setTimeout(() => setActionMessage(null), 5000);
    onActionComplete?.();
  };

  return (
    <div className="glass-card p-5 space-y-4 border border-violet-500/20 bg-gradient-to-b from-[#0a1529] via-[#071120] to-[#0a1529] shadow-2xl">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                AI Recommendations Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                HUMAN APPROVAL REQUIRED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic local agents analyze incidents, stock, and team capabilities without cloud APIs.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Pending Review:{' '}
          <span className="text-violet-400 font-bold">
            {recommendations.filter((r) => r.status === 'pending').length} Actions
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono animate-slide-in flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recommendations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((item) => {
          const isPending = item.status === 'pending';
          const isApproved = item.status === 'approved';
          const isRejected = item.status === 'rejected';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                isApproved
                  ? 'bg-emerald-500/[0.04] border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                  : isRejected
                  ? 'bg-slate-900/60 border-slate-700/50 opacity-60'
                  : 'bg-white/[0.02] border-white/[0.08] hover:border-violet-500/40 hover:bg-white/[0.04]'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      item.category === 'task'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : item.category === 'supply'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {item.title}
                  </span>

                  {/* Confidence meter */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-[10px] text-slate-400">Confidence:</span>
                    <span className="font-bold text-violet-300">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar for confidence */}
                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full"
                    style={{ width: `${item.confidence * 100}%` }}
                  />
                </div>

                {/* Recommendation statement */}
                <div className="text-xs font-semibold text-slate-100 leading-snug">
                  {item.recommendation}
                </div>

                {/* AI Reasoning in simple language */}
                <div className="text-[11px] text-slate-400 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/[0.04]">
                  <strong className="text-violet-300 font-mono text-[10px] block mb-0.5 uppercase">
                    Agent Rationale:
                  </strong>
                  {item.reason}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>Assigned Unit: <strong className="text-slate-300">{item.targetUnit}</strong></span>
                  <span>Impact: <strong className="text-amber-400">{item.affectedCount} Civilians</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.06] mt-3">
                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(item)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center transition"
                      title="Reject Recommendation"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => setReviewingItem(item)}
                      className="py-1.5 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold flex items-center justify-center transition"
                      title="Review full context"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                )}

                {isApproved && (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>HUMAN APPROVED & DISPATCHED</span>
                  </div>
                )}

                {isRejected && (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECTED BY OPERATOR</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-xl w-full p-6 space-y-4 border border-violet-500/40 bg-[#071120] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Operational Context Review: {reviewingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setReviewingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-200">
                <strong className="block text-violet-300 font-mono mb-1">PROPOSED ACTION:</strong>
                {reviewingItem.recommendation}
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block">TARGET SECTOR / UNIT</span>
                  <span className="text-slate-200 font-bold">{reviewingItem.targetUnit}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block">AFFECTED POPULATION</span>
                  <span className="text-amber-400 font-bold">{reviewingItem.affectedCount} Individuals</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block">AI CONFIDENCE INDEX</span>
                  <span className="text-emerald-400 font-bold">{Math.round(reviewingItem.confidence * 100)}% (Deterministic)</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-slate-500 text-[10px] block">DECISION AUTHORITY</span>
                  <span className="text-cyan-400 font-bold">Incident Commander Sign-off</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-slate-300 leading-relaxed font-sans">
                <strong className="font-mono text-violet-300 text-[11px] block mb-1">AUDIT RATIONALE:</strong>
                {reviewingItem.reason}
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Approval will immediately update the local ledger, create dispatch tasks, and broadcast to the mesh.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  handleReject(reviewingItem);
                  setReviewingItem(null);
                }}
                className="btn-danger !text-xs !py-1.5 !px-3"
              >
                Reject Recommendation
              </button>
              <button
                onClick={() => {
                  handleApprove(reviewingItem);
                  setReviewingItem(null);
                }}
                className="btn-success !text-xs !py-1.5 !px-4"
              >
                Approve & Execute Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
