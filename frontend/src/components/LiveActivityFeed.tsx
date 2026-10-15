import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Filter, 
  Terminal, 
  Radio, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { wsClient } from '../lib/websocket';
import { AuditLog } from '../types';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  category: 'mesh' | 'alert' | 'ai' | 'approval' | 'supply';
  node?: string;
}

interface LiveActivityFeedProps {
  initialLogs?: AuditLog[];
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ initialLogs = [] }) => {
  const [filter, setFilter] = useState<'all' | 'alert' | 'ai' | 'mesh' | 'approval'>('all');
  const [events, setEvents] = useState<ActivityEvent[]>([
    { id: 'ev-1', timestamp: '12:31:04', type: 'INCIDENT_CREATED', message: 'Flash flood reported at East Riverside District', category: 'alert', node: 'RESCUE-A' },
    { id: 'ev-2', timestamp: '12:31:05', type: 'AI_ANALYSIS_STARTED', message: 'Local IncidentAgent scanning keywords & duplicate radii', category: 'ai', node: 'LOCAL_AGENT' },
    { id: 'ev-3', timestamp: '12:31:06', type: 'SEVERITY_CRITICAL', message: 'Threat level scored 0.95 — Immediate life safety hazard', category: 'alert', node: 'LOCAL_AGENT' },
    { id: 'ev-4', timestamp: '12:31:07', type: 'MESH_BROADCAST', message: 'Disaster packet distributed to reachable peers via 802.11s', category: 'mesh', node: 'RESCUE-A' },
    { id: 'ev-5', timestamp: '12:31:08', type: 'RESCUE-B_OFFLINE', message: 'Field unit signal lost — radio partition detected', category: 'mesh', node: 'RESCUE-B' },
    { id: 'ev-6', timestamp: '12:31:09', type: 'MESSAGE_QUEUED', message: 'Critical dispatch packet retained in persistent SQLite store-and-forward', category: 'mesh', node: 'SYNC_BUS' },
    { id: 'ev-7', timestamp: '12:31:15', type: 'RESCUE-B_ONLINE', message: 'Signal re-established — P2P handshake verified', category: 'mesh', node: 'RESCUE-B' },
    { id: 'ev-8', timestamp: '12:31:16', type: 'MESSAGE_SYNCED', message: 'Queued alert delivered idempotently with SHA-256 verification', category: 'mesh', node: 'RESCUE-B' },
    { id: 'ev-9', timestamp: '12:31:18', type: 'SUPPLY_RECOMMENDATION', message: 'SupplyAgent calculated 400L drinking water allocation', category: 'supply', node: 'SUPPLY-C' },
    { id: 'ev-10', timestamp: '12:31:22', type: 'HUMAN_APPROVAL', message: 'Commander Davis verified & approved rescue operation', category: 'approval', node: 'COMMAND_HQ' },
    { id: 'ev-11', timestamp: '12:31:24', type: 'TASK_DISPATCHED', message: 'Zodiac inflatable extraction boat deployed to Riverside zone', category: 'approval', node: 'RESCUE-A' },
  ]);

  // Merge real audit logs if provided
  useEffect(() => {
    if (initialLogs.length > 0) {
      const formatted = initialLogs.map((log) => {
        const timeStr = new Date(log.created_at).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        let category: 'mesh' | 'alert' | 'ai' | 'approval' | 'supply' = 'mesh';
        if (log.action.includes('INCIDENT') || log.action.includes('CRITICAL')) category = 'alert';
        else if (log.action.includes('AGENT') || log.action.includes('AI')) category = 'ai';
        else if (log.action.includes('APPROVED') || log.action.includes('TASK')) category = 'approval';
        else if (log.action.includes('SUPPLY') || log.action.includes('INVENTORY')) category = 'supply';

        return {
          id: log.id,
          timestamp: timeStr,
          type: log.action,
          message: log.details || `${log.action} on ${log.entity_type || 'record'}`,
          category,
          node: log.device_id,
        };
      });

      // Prepend any new unique ones
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newOnes = formatted.filter((f) => !existingIds.has(f.id));
        return [...newOnes, ...prev].slice(0, 25);
      });
    }
  }, [initialLogs]);

  // Listen to WebSocket events live
  useEffect(() => {
    const handleWsEvent = (eventAction: string, category: 'mesh' | 'alert' | 'ai' | 'approval' | 'supply', detail: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newEv: ActivityEvent = {
        id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        type: eventAction,
        message: detail,
        category,
        node: 'MESH_P2P',
      };
      setEvents((prev) => [newEv, ...prev.slice(0, 24)]);
    };

    const unsubs = [
      wsClient.on('incident_created', (data) =>
        handleWsEvent('INCIDENT_CREATED', 'alert', `New incident reported: ${data?.title || 'Emergency reported'}`)
      ),
      wsClient.on('task_approved', (data) =>
        handleWsEvent('HUMAN_APPROVAL', 'approval', `Task authorized: ${data?.title || 'Rescue Operation'}`)
      ),
      wsClient.on('peer_connected', (data) =>
        handleWsEvent('PEER_CONNECTED', 'mesh', `Peer ${data?.device_id || 'node'} joined mesh network`)
      ),
      wsClient.on('peer_disconnected', (data) =>
        handleWsEvent('PEER_DISCONNECTED', 'mesh', `Peer ${data?.device_id || 'node'} offline — store & forward active`)
      ),
      wsClient.on('demo_step', (data) => {
        if (data?.message) {
          handleWsEvent(`STEP_${data.step || 'SIM'}`, 'mesh', data.message);
        }
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const getBadgeStyle = (category: string, type: string) => {
    if (type.includes('CRITICAL') || type.includes('OFFLINE')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (category === 'ai') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (category === 'approval') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (category === 'supply') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (type.includes('QUEUED')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  };

  return (
    <div className="glass-card p-5 space-y-4 border border-white/[0.08] bg-[#071120] shadow-xl">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Real-Time Activity Feed
          </h3>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilter('alert')}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === 'alert'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALERTS
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === 'ai'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI AGENTS
          </button>
          <button
            onClick={() => setFilter('mesh')}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === 'mesh'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MESH P2P
          </button>
          <button
            onClick={() => setFilter('approval')}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === 'approval'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            APPROVALS
          </button>
        </div>
      </div>

      {/* Terminal Event Stream */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="flex items-start gap-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] hover:border-white/[0.12] transition font-mono text-xs"
          >
            {/* Timestamp */}
            <span className="text-slate-500 text-[11px] shrink-0 pt-0.5">
              {ev.timestamp}
            </span>

            {/* Type Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getBadgeStyle(
                ev.category,
                ev.type
              )}`}
            >
              {ev.type}
            </span>

            {/* Event Description */}
            <span className="text-slate-300 flex-1 break-words font-sans text-xs">
              {ev.message}
            </span>

            {/* Node identifier */}
            {ev.node && (
              <span className="text-[10px] text-slate-500 shrink-0 hidden sm:inline px-1.5 py-0.2 rounded bg-white/[0.03]">
                {ev.node}
              </span>
            )}
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs italic font-mono">
            No events match selected category filter.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Auto-logging enabled via local WebSocket broadcast bus</span>
        <span>Store-and-forward tamper resistance active</span>
      </div>
    </div>
  );
};
