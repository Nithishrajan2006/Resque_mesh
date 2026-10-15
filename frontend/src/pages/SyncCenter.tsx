import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  RotateCcw, 
  Play, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  FileCode, 
  Radio, 
  ArrowRight, 
  X,
  Layers,
  Check
} from 'lucide-react';
import { 
  listSyncMessages, 
  getSyncStats, 
  listConflicts, 
  resolveConflict, 
  retryFailedMessages, 
  processQueuedMessages 
} from '../lib/api';
import { SyncMessage, ConflictRecord } from '../types';

export const SyncCenter: React.FC = () => {
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Inspector Modal
  const [inspectMessage, setInspectMessage] = useState<SyncMessage | null>(null);

  // Conflict Resolution Modal
  const [resolvingConflict, setResolvingConflict] = useState<ConflictRecord | null>(null);
  const [resolutionChoice, setResolutionChoice] = useState<'local' | 'remote' | 'merge'>('local');
  const [resolverName, setResolverName] = useState<string>('Commander Davis');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [msgRes, statRes, confRes] = await Promise.all([
        listSyncMessages(),
        getSyncStats(),
        listConflicts(),
      ]);
      setMessages(msgRes.data);
      setStats(statRes.data);
      setConflicts(confRes.data);
    } catch (err) {
      console.error('Failed to fetch sync data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const res = await processQueuedMessages();
      alert(`Sync Engine executed: ${res.data.delivered} delivered to online peers, ${res.data.still_queued} remain queued in store-and-forward.`);
      fetchData();
    } catch (err) {
      console.error('Process queue failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailedMessages();
      fetchData();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleResolveConflict = async () => {
    if (!resolvingConflict) return;
    try {
      let resolutionText = '';
      if (resolutionChoice === 'local') resolutionText = `Adopted local version: ${resolvingConflict.local_version}`;
      else if (resolutionChoice === 'remote') resolutionText = `Adopted remote version: ${resolvingConflict.remote_version}`;
      else resolutionText = 'Merged status to active with consolidated incident notes';

      await resolveConflict(resolvingConflict.id, {
        resolution: resolutionText,
        resolved_by: resolverName,
      });
      setResolvingConflict(null);
      fetchData();
    } catch (err) {
      console.error('Conflict resolution failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            SYNCHRONIZATION & CONFLICT CENTER
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store-and-forward message queues, packet delivery metrics, multi-hop routes, and concurrent edit conflict resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleProcessQueue}
            disabled={isProcessing}
            className="btn-primary !text-xs !py-2 !px-3"
          >
            <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : 'fill-current'}`} />
            <span>Process Mesh Queue</span>
          </button>

          <button
            onClick={handleRetryFailed}
            className="btn-secondary !text-xs !py-2 !px-3"
            title="Retry failed packets"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Failed</span>
          </button>
        </div>
      </div>

      {/* Sync Metrics Bar */}
      <div className="glass-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Packets in Queue</span>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {stats?.queued ?? 0}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Delivered via Mesh</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {stats?.delivered ?? 0}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Failed / Timed Out</span>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {stats?.failed ?? 0}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Unresolved Conflicts</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {stats?.unresolved_conflicts ?? 0}
          </div>
        </div>
      </div>

      {/* Concurrent Version Conflict Records Section */}
      <div className="glass-card p-5 space-y-4 border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Concurrent Data Version Conflicts ({conflicts.filter((c) => !c.resolved).length} Pending)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            MANUAL INSPECTION REQUIRED
          </span>
        </div>

        <p className="text-xs text-slate-400">
          When decentralized nodes submit competing updates while separated by network partitions, ResQMesh prevents silent data loss by isolating divergent versions for authorized human resolution.
        </p>

        <div className="space-y-3 pt-2">
          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className={`p-4 rounded-xl border space-y-3 ${
                conf.resolved
                  ? 'bg-white/[0.02] border-white/[0.05] opacity-60'
                  : 'bg-amber-500/[0.06] border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">
                    Entity: {conf.entity_type.toUpperCase()} #{conf.entity_id.substring(0, 8)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                    {conf.conflict_type}
                  </span>
                </div>
                {conf.resolved ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    ✓ RESOLVED
                  </span>
                ) : (
                  <button
                    onClick={() => setResolvingConflict(conf)}
                    className="btn-primary !text-[11px] !py-1 !px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Resolve Conflict
                  </button>
                )}
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Local Device State</span>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {conf.local_version}
                  </pre>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-bold text-violet-400 uppercase">Incoming Remote Mesh State</span>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {conf.remote_version}
                  </pre>
                </div>
              </div>

              {conf.resolved && conf.resolution && (
                <div className="text-xs font-mono text-emerald-400/90 pt-1">
                  Resolution Decision: {conf.resolution} (Resolved by {conf.resolved_by})
                </div>
              )}
            </div>
          ))}

          {conflicts.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs italic">
              Zero active data conflicts. All mesh nodes are 100% converged.
            </div>
          )}
        </div>
      </div>

      {/* Sync Messages Queue Table */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Mesh Packet Store & Forward Queue ({messages.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th className="p-3">Packet ID</th>
                <th className="p-3">Route (Src → Dst)</th>
                <th className="p-3">Type</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Hops</th>
                <th className="p-3">Attempts</th>
                <th className="p-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {messages.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02]">
                  <td className="p-3 text-cyan-300 font-bold truncate max-w-[120px]">
                    {m.message_id}
                  </td>
                  <td className="p-3 text-slate-200">
                    <span className="text-slate-300">{m.source_device_id}</span>
                    <span className="text-cyan-400 mx-1.5">→</span>
                    <span className="text-slate-300">{m.destination_device_id || 'BROADCAST'}</span>
                  </td>
                  <td className="p-3 text-slate-400">{m.payload_type}</td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        m.priority <= 2
                          ? 'bg-red-500/20 text-red-400'
                          : m.priority <= 4
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      P{m.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'delivered'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : m.status === 'queued'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          : m.status === 'sent'
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{m.hop_count}</td>
                  <td className="p-3 text-slate-400">{m.delivery_attempts}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setInspectMessage(m)}
                      className="text-cyan-400 hover:text-cyan-300 underline text-[11px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Message Payload Inspector */}
      {inspectMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Packet {inspectMessage.message_id}
              </h2>
              <button onClick={() => setInspectMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Source: <span className="text-white">{inspectMessage.source_device_id}</span></div>
                <div>Destination: <span className="text-white">{inspectMessage.destination_device_id}</span></div>
                <div>Status: <span className="text-cyan-300">{inspectMessage.status}</span></div>
                <div>Schema: <span className="text-white">v{inspectMessage.schema_version}</span></div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Payload Content:</span>
                <pre className="p-3 rounded-lg bg-black/60 border border-white/[0.08] text-cyan-300 overflow-x-auto whitespace-pre-wrap max-h-56">
                  {inspectMessage.payload || 'No payload'}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button onClick={() => setInspectMessage(null)} className="btn-secondary !text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conflict Resolution Workflow */}
      {resolvingConflict && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full bg-[#0a1628] border-amber-500/40 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Manual Conflict Resolution Workflow
                </h2>
              </div>
              <button onClick={() => setResolvingConflict(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select which dataset should become the authoritative version across the mesh:
            </p>

            <div className="space-y-3 text-xs">
              <label
                onClick={() => setResolutionChoice('local')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  resolutionChoice === 'local'
                    ? 'bg-cyan-500/[0.08] border-cyan-500/40 text-cyan-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold text-white">Preserve Local Node Version</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{resolvingConflict.local_version}</div>
                </div>
                {resolutionChoice === 'local' && <Check className="w-4 h-4 text-cyan-400" />}
              </label>

              <label
                onClick={() => setResolutionChoice('remote')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  resolutionChoice === 'remote'
                    ? 'bg-violet-500/[0.08] border-violet-500/40 text-violet-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold text-white">Accept Incoming Remote Version</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{resolvingConflict.remote_version}</div>
                </div>
                {resolutionChoice === 'remote' && <Check className="w-4 h-4 text-violet-400" />}
              </label>

              <label
                onClick={() => setResolutionChoice('merge')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  resolutionChoice === 'merge'
                    ? 'bg-emerald-500/[0.08] border-emerald-500/40 text-emerald-300'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold text-white">Merge Both Datasets (Union)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Combine notes and set status to active response</div>
                </div>
                {resolutionChoice === 'merge' && <Check className="w-4 h-4 text-emerald-400" />}
              </label>

              <div>
                <label className="block text-slate-400 mb-1">Authorizing Official Name *</label>
                <input
                  type="text"
                  required
                  value={resolverName}
                  onChange={(e) => setResolverName(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingConflict(null)}
                className="btn-secondary !text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveConflict}
                className="btn-primary !text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
