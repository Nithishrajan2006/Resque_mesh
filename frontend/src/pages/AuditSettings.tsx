import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings, 
  Shield, 
  Lock, 
  HardDrive, 
  RotateCcw, 
  RefreshCw, 
  EyeOff, 
  Server,
  Activity,
  Cpu
} from 'lucide-react';
import { listAuditLogs, getActionSummary, resetDemo, loadDemo } from '../lib/api';
import { AuditLog } from '../types';

export const AuditSettings: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionSummary, setActionSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('');

  // Settings states
  const [nodeId, setNodeId] = useState<string>('HQ-EDGE-NODE-01');
  const [radioChannel, setRadioChannel] = useState<string>('CH-04 (915 MHz LoRa US/AU)');
  const [coordinatePrivacy, setCoordinatePrivacy] = useState<boolean>(true);
  const [redactMedical, setRedactMedical] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '50' };
      if (filterAction) params.action = filterAction;
      const [logsRes, summaryRes] = await Promise.all([
        listAuditLogs(params),
        getActionSummary(),
      ]);
      setLogs(logsRes.data);
      setActionSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAction]);

  const handleReset = async () => {
    if (!window.confirm('Erase all database records and start with clean tables?')) return;
    try {
      await resetDemo();
      fetchData();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleReloadDemo = async () => {
    try {
      await loadDemo();
      fetchData();
    } catch (err) {
      console.error('Reload demo failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            AUDIT LOGS & EDGE NODE SETTINGS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable operation history, location privacy policies, and local radio node configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReloadDemo}
            className="btn-secondary !text-xs !py-2 !px-3"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Demo Data</span>
          </button>
          <button
            onClick={handleReset}
            className="btn-danger !text-xs !py-2 !px-3"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Database</span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node & Hardware Configuration */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Edge Node Hardware Identity
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Local Node Identifier</label>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Radio Carrier Frequency / Mesh Channel</label>
              <select
                value={radioChannel}
                onChange={(e) => setRadioChannel(e.target.value)}
                className="select-field font-mono"
              >
                <option value="CH-01 (433 MHz EU)">CH-01 (433 MHz EU)</option>
                <option value="CH-04 (915 MHz LoRa US/AU)">CH-04 (915 MHz LoRa US/AU)</option>
                <option value="CH-08 (868 MHz ISM)">CH-08 (868 MHz ISM)</option>
                <option value="CH-12 (2.4 GHz 802.11s Ad-Hoc)">CH-12 (2.4 GHz 802.11s Ad-Hoc)</option>
              </select>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 font-mono space-y-1">
              <div className="flex justify-between">
                <span>Storage Engine:</span>
                <span className="text-cyan-300">SQLite Async WAL</span>
              </div>
              <div className="flex justify-between">
                <span>Deduplication Algorithm:</span>
                <span className="text-cyan-300">SHA-256 Checksum</span>
              </div>
              <div className="flex justify-between">
                <span>Max Forwarding Hops:</span>
                <span className="text-cyan-300">5 Hops</span>
              </div>
            </div>
          </div>
        </div>

        {/* Victim Location & Civilian Privacy Guardrails */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Civilian Location & Privacy Controls
            </h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            In crisis response, unencrypted civilian GPS coordinates broadcast over open mesh frequencies can create severe security risks. ResQMesh enforces privacy guardrails:
          </p>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GPS Coordinate Precision Fuzzing</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Truncates coordinates to 2 decimal places (~1.1km) in mesh broadcasts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={coordinatePrivacy}
                onChange={(e) => setCoordinatePrivacy(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Sensitive Medical PII Redaction</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Strips personal medical names and IDs before store-and-forward transmission.
                </div>
              </div>
              <input
                type="checkbox"
                checked={redactMedical}
                onChange={(e) => setRedactMedical(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Immutable Decentralized Audit Ledger ({logs.length} Events)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by action name..."
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-field !text-xs !py-1 !px-2.5 w-48 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Actor / Device</th>
                <th className="p-3">Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-cyan-300 font-bold">
                    {log.action}
                  </td>
                  <td className="p-3 text-slate-400 uppercase text-[11px]">
                    {log.entity_type || 'SYSTEM'}
                  </td>
                  <td className="p-3 text-slate-300">
                    <span>{log.performed_by}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({log.device_id})</span>
                  </td>
                  <td className="p-3 text-slate-400 truncate max-w-md">
                    {log.details || log.new_value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
