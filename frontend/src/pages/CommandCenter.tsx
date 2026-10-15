import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckSquare, 
  Boxes, 
  Network, 
  RefreshCw, 
  Flame, 
  ShieldAlert, 
  Activity, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { 
  getDashboardStats, 
  listIncidents, 
  listTasks, 
  getInventorySummary,
  listAuditLogs 
} from '../lib/api';
import { wsClient } from '../lib/websocket';
import { DashboardStats, Incident, RescueTask, AuditLog } from '../types';

interface CommandCenterProps {
  onOpenWorkflow: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onOpenWorkflow }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<RescueTask[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [statsRes, incRes, taskRes, invRes, auditRes] = await Promise.all([
        getDashboardStats(),
        listIncidents({ limit: '6' }),
        listTasks(),
        getInventorySummary(),
        listAuditLogs({ limit: '6' }),
      ]);
      setStats(statsRes.data);
      setIncidents(incRes.data);
      setTasks(taskRes.data);
      setInventoryItems(invRes.data.items || []);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time events over WebSocket
    const unsubs = [
      wsClient.on('incident_created', fetchData),
      wsClient.on('incident_updated', fetchData),
      wsClient.on('task_created', fetchData),
      wsClient.on('task_approved', fetchData),
      wsClient.on('inventory_updated', fetchData),
      wsClient.on('peer_connected', fetchData),
      wsClient.on('peer_disconnected', fetchData),
      wsClient.on('demo_loaded', fetchData),
      wsClient.on('demo_step', fetchData),
      wsClient.on('demo_reset', fetchData),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Compute severity chart data
  const severityCounts = {
    critical: incidents.filter((i) => i.severity === 'critical').length,
    high: incidents.filter((i) => i.severity === 'high').length,
    medium: incidents.filter((i) => i.severity === 'medium').length,
    low: incidents.filter((i) => i.severity === 'low').length,
  };

  const severityChartData = [
    { name: 'Critical', count: severityCounts.critical, fill: '#ef4444' },
    { name: 'High', count: severityCounts.high, fill: '#f97316' },
    { name: 'Medium', count: severityCounts.medium, fill: '#eab308' },
    { name: 'Low', count: severityCounts.low, fill: '#10b981' },
  ];

  // Compute task status data
  const taskStatusData = [
    { name: 'Unassigned', value: tasks.filter((t) => t.status === 'unassigned').length, color: '#f59e0b' },
    { name: 'Assigned', value: tasks.filter((t) => t.status === 'assigned').length, color: '#06b6d4' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, color: '#8b5cf6' },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length, color: '#10b981' },
  ].filter((d) => d.value > 0);

  // Critical alerts
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Emergency Command Level */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-cyan-500/10 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide">
                DISASTER RESPONSE COMMAND CENTER
              </h1>
              <span className="badge-critical text-[10px]">CONDITION RED</span>
            </div>
            <p className="text-xs text-slate-400">
              Sector: <span className="text-slate-200">Millbrook Valley Basin</span> • Network: <span className="text-cyan-400">P2P Ad-Hoc 802.11s + LoRa SIM</span> • Operating Offline
            </p>
          </div>
        </div>

        <button
          onClick={onOpenWorkflow}
          className="btn-primary !py-2 !px-4 text-xs bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-violet-500/20 whitespace-nowrap"
        >
          <Cpu className="w-4 h-4" />
          <span>Simulate Live Disaster Response</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Incidents"
          value={stats?.total_incidents ?? '—'}
          subtext="Sector reports"
          icon={AlertTriangle}
          color="cyan"
        />
        <KPICard
          title="Critical Alerts"
          value={stats?.critical_incidents ?? '—'}
          subtext="Immediate threat"
          icon={Flame}
          color="red"
          badge="URGENT"
        />
        <KPICard
          title="Active Tasks"
          value={stats?.active_tasks ?? '—'}
          subtext="Rescue deployments"
          icon={CheckSquare}
          color="amber"
        />
        <KPICard
          title="Relief Stock"
          value={stats?.available_supply_units ? Math.round(stats.available_supply_units) : '—'}
          subtext="Available units"
          icon={Boxes}
          color="emerald"
        />
        <KPICard
          title="Mesh Peers"
          value={stats?.online_peers ?? '—'}
          subtext="Active field nodes"
          icon={Network}
          color="violet"
        />
        <KPICard
          title="Sync Queue"
          value={stats?.pending_sync ?? '—'}
          subtext="Store-and-forward"
          icon={RefreshCw}
          color="cyan"
          badge={stats?.conflicts ? `${stats.conflicts} CONFLICT` : undefined}
        />
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Severity Breakdown */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Incidents by Severity
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LIVE CLASSIFICATION</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Allocation Breakdown */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Task Coordination Status
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{tasks.length} TOTAL</span>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a1628',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No active tasks recorded</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] font-mono text-slate-400">
            {taskStatusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Stock Levels vs Reserves */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Key Resource Reserves
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LEDGER VERIFIED</span>
          </div>
          <div className="space-y-3 pt-1">
            {inventoryItems.slice(0, 4).map((item) => {
              const pct = item.minimum_stock > 0 
                ? Math.min(Math.round((item.current_stock / (item.minimum_stock * 2)) * 100), 100)
                : 100;
              const isLow = item.is_low;

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">{item.name}</span>
                    <span className={isLow ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {item.current_stock} / {item.minimum_stock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {inventoryItems.length === 0 && (
              <p className="text-xs text-slate-500 italic py-6 text-center">No supplies registered</p>
            )}
          </div>
        </div>
      </div>

      {/* Lower Split: Live Incident Feed & Recent Mesh Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Incident Stream */}
        <div className="lg:col-span-7 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Incident Stream
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'Just now'}
            </span>
          </div>

          <div className="space-y-2.5">
            {incidents.slice(0, 5).map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`badge-${
                        inc.severity === 'critical'
                          ? 'critical'
                          : inc.severity === 'high'
                          ? 'high'
                          : inc.severity === 'medium'
                          ? 'medium'
                          : 'low'
                      }`}
                    >
                      {inc.severity.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {inc.title}
                    </span>
                    {inc.is_verified && (
                      <span className="text-[10px] font-mono px-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {inc.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>📍 {inc.location_label || 'Coordinates logged'}</span>
                    <span>•</span>
                    <span>Device: {inc.source_device_id}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {incidents.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No incidents recorded. Click "Load Demo Scenario" above to populate realistic data.
              </div>
            )}
          </div>
        </div>

        {/* Mesh Activity & Audit Log */}
        <div className="lg:col-span-5 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Decentralized Audit Log
            </h2>
            <span className="text-[10px] font-mono text-slate-500">IMMUTABLE LOCAL</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {log.details || `Performed on ${log.entity_type}`}
                </p>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Actor: {log.performed_by}</span>
                  <span>Node: {log.device_id}</span>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No audit events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
