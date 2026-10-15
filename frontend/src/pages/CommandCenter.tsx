import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  LifeBuoy, 
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
  Cpu,
  ChevronDown,
  ChevronUp,
  Layers,
  Terminal,
  Database,
  Radio
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

import { DisasterHeroSection } from '../components/DisasterHeroSection';
import { WhyResQMeshBanner } from '../components/DisasterVisuals';
import { InteractiveMeshVisualizer } from '../components/InteractiveMeshVisualizer';
import { OfflineInteractiveExplainer } from '../components/OfflineInteractiveExplainer';
import { FieldIntelligenceCard } from '../components/FieldIntelligenceCard';
import { ArchitectureFlowBanner } from '../components/ArchitectureFlowBanner';
import { AIRecommendationsPanel } from '../components/AIRecommendationsPanel';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { IncidentIntelligenceModal } from '../components/IncidentIntelligenceModal';
import { ProblemSolutionInfographic } from '../components/ProblemSolutionInfographic';
import { AIVisualIntelligenceHub } from '../components/AIVisualIntelligenceHub';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

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
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState<boolean>(false);
  const [activeModalImageId, setActiveModalImageId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const handleOpenImage = (id: string) => {
    setActiveModalImageId(id);
    setIsLightboxOpen(true);
  };

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

  // Compute total people needing help
  const peopleNeedingHelp = incidents.reduce((sum, inc) => sum + (inc.affected_count || 0), 0);
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;

  // Compute severity chart data
  const severityCounts = {
    critical: criticalCount,
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
    { name: 'Waiting Approval', value: tasks.filter((t) => t.status === 'unassigned').length, color: '#f59e0b' },
    { name: 'Approved / Ready', value: tasks.filter((t) => t.status === 'assigned').length, color: '#06b6d4' },
    { name: 'En Route / Active', value: tasks.filter((t) => t.status === 'in_progress').length, color: '#8b5cf6' },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const scrollToNetwork = () => {
    const el = document.getElementById('network-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">
      {/* 1. Large Disaster Response Command Center Hero Section */}
      <DisasterHeroSection
        stats={stats}
        criticalCount={criticalCount}
        peopleNeedingHelp={peopleNeedingHelp}
        activeTeamsCount={stats?.active_tasks ?? 6}
        availableSuppliesCount={stats?.available_supply_units ? Math.round(stats.available_supply_units) : 8005}
        onRunSimulation={onOpenWorkflow}
        onExploreNetwork={scrollToNetwork}
        onInspectSceneIncident={() => {
          const crit = incidents.find((i) => i.severity === 'critical') || incidents[0];
          if (crit) setSelectedIncident(crit);
        }}
        onInspectImage={handleOpenImage}
      />

      {/* 2. Hackathon Value Proposition: Why ResQMesh? (3 Pillars) */}
      <WhyResQMeshBanner />

      {/* 2.1 Mission Problem & Solution Blueprint */}
      <ProblemSolutionInfographic onInspectImage={handleOpenImage} />

      {/* 3. Human-Friendly KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="People & Incidents Needing Help"
          value={stats?.total_incidents ?? '—'}
          subtext="Logged in field"
          icon={AlertTriangle}
          color="cyan"
        />
        <KPICard
          title="Critical Emergencies"
          value={stats?.critical_incidents ?? '—'}
          subtext="Immediate action needed"
          icon={Flame}
          color="red"
          badge="URGENT"
        />
        <KPICard
          title="Rescue Missions"
          value={stats?.active_tasks ?? '—'}
          subtext="Active field deployments"
          icon={LifeBuoy}
          color="amber"
        />
        <KPICard
          title="Supplies Available"
          value={stats?.available_supply_units ? Math.round(stats.available_supply_units) : '—'}
          subtext="Water, food & medkits"
          icon={Boxes}
          color="emerald"
        />
        <KPICard
          title="Rescue Devices Connected"
          value={stats?.online_peers ?? '—'}
          subtext="Active mesh nodes"
          icon={Network}
          color="violet"
        />
        <KPICard
          title="Messages Waiting to Sync"
          value={stats?.pending_sync ?? '—'}
          subtext="Store-and-forward queue"
          icon={RefreshCw}
          color="cyan"
          badge={stats?.conflicts ? `${stats.conflicts} CONFLICT` : undefined}
        />
      </div>

      {/* 4. Feature Star: "WHAT HAPPENS WHEN THE INTERNET FAILS?" (11-Step Guided Stepper) */}
      <OfflineInteractiveExplainer onStepExecuted={fetchData} />

      {/* 5. Interactive Mesh Network Topology (RESCUE-A, RESCUE-B, DRONE-01, SUPPLY-C) */}
      <div id="network-section">
        <InteractiveMeshVisualizer />
      </div>

      {/* 6. Middle Grid: Field Intelligence & Tactical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Field Intelligence Drone HUD Card (6 cols) */}
        <div className="lg:col-span-6">
          <FieldIntelligenceCard
            onInspectTarget={() => {
              const crit = incidents.find((i) => i.severity === 'critical') || incidents[0];
              if (crit) setSelectedIncident(crit);
            }}
          />
        </div>

        {/* Charts: Task Status Breakdown & Resource Reserves (6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rescue Missions Status Breakdown */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Rescue Missions Status
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{tasks.length} TOTAL</span>
            </div>
            <div className="h-44 w-full flex items-center justify-center">
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
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
            <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-slate-400">
              {taskStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Resource Reserves */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Key Relief Reserves
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
                      <span className="text-slate-300 font-medium truncate max-w-[130px]">{item.name}</span>
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
      </div>

      {/* 7. Dedicated AI Recommendations Panel (Human Authorization Required) */}
      <AIRecommendationsPanel onActionComplete={fetchData} />

      {/* 8. Live Incident Stream & Real-Time Activity Feed */}
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
              Click any report to inspect AI Intelligence Dossier
            </span>
          </div>

          <div className="space-y-2.5">
            {incidents.slice(0, 5).map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/40 transition flex items-start justify-between gap-3 cursor-pointer group shadow-sm hover:shadow-cyan-500/5"
                title="Click to view Incident Intelligence Dossier"
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
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition truncate">
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
                    <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                      View Intelligence ➔
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {incidents.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No incidents recorded. Click "Load Scenario" above to populate realistic data.
              </div>
            )}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="lg:col-span-5">
          <LiveActivityFeed initialLogs={auditLogs} />
        </div>
      </div>

      {/* 8.5 AI Field Intelligence & Visual Gallery */}
      <AIVisualIntelligenceHub onInspectImage={handleOpenImage} />

      {/* 9. Expandable Technical Architecture & Edge Telemetry Section */}
      <div className="border border-white/[0.08] rounded-2xl bg-[#06101e] overflow-hidden">
        <button
          onClick={() => setIsTechDetailsOpen(!isTechDetailsOpen)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-mono text-slate-400 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Technical Architecture & Low-Level Edge Telemetry
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Click to {isTechDetailsOpen ? 'Hide' : 'Expand'}
            </span>
          </div>
          {isTechDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isTechDetailsOpen && (
          <div className="p-6 border-t border-white/[0.06] space-y-6 animate-slide-in">
            {/* Visual Architecture Flow */}
            <ArchitectureFlowBanner />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase text-cyan-400 font-bold">Persistence Bus</span>
                <p className="text-slate-300">Synchronous SQLite engine with zero async race conditions</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase text-violet-400 font-bold">Deduplication</span>
                <p className="text-slate-300">SHA-256 payload checksum cache with 5-minute suppression window</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase text-amber-400 font-bold">Relay Guardrails</span>
                <p className="text-slate-300">Max 5-hop TTL tracking with device ID loop suppression</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incident Intelligence Modal */}
      {selectedIncident && (
        <IncidentIntelligenceModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdated={fetchData}
        />
      )}

      {/* AI Visual Intelligence Lightbox Modal */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        activeImageId={activeModalImageId}
        onClose={() => setIsLightboxOpen(false)}
        onSelectImage={(id) => setActiveModalImageId(id)}
      />
    </div>
  );
};
