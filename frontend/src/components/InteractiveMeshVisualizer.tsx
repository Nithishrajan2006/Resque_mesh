import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Battery, 
  Radio, 
  Send, 
  RefreshCw, 
  Power, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { listPeers, connectPeer, disconnectPeer, syncPeer, sendPeerMessage } from '../lib/api';
import { wsClient } from '../lib/websocket';
import { Peer } from '../types';

export const InteractiveMeshVisualizer: React.FC = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('RESCUE-A');
  const [isSimulatingPacket, setIsSimulatingPacket] = useState<boolean>(false);
  const [packetTrail, setPacketTrail] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPeers = async () => {
    try {
      const res = await listPeers();
      setPeers(res.data);
    } catch (err) {
      console.error('Failed to fetch mesh peers:', err);
    }
  };

  useEffect(() => {
    fetchPeers();

    const unsubs = [
      wsClient.on('peer_connected', fetchPeers),
      wsClient.on('peer_disconnected', fetchPeers),
      wsClient.on('message_queued', fetchPeers),
      wsClient.on('message_synced', fetchPeers),
      wsClient.on('demo_loaded', fetchPeers),
      wsClient.on('demo_step', fetchPeers),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Node position map on the 600x320 SVG canvas
  const nodePositions: Record<string, { x: number; y: number; label: string; role: string; icon: string }> = {
    'RESCUE-A': { x: 120, y: 90, label: 'RESCUE-A', role: 'Tactical Search & Rescue', icon: '🚤' },
    'DRONE-01': { x: 420, y: 70, label: 'DRONE-01', role: 'Aerial Mesh Relay', icon: '🚁' },
    'RESCUE-B': { x: 140, y: 250, label: 'RESCUE-B', role: 'Mobile Triage Unit', icon: '🚑' },
    'SUPPLY-C': { x: 450, y: 240, label: 'SUPPLY-C', role: 'Supply Depot Charlie', icon: '📦' },
  };

  // Fallback defaults if peers DB is loading
  const getNodeData = (id: string) => {
    return (
      peers.find((p) => p.device_id === id) || {
        device_id: id,
        name: nodePositions[id]?.label || id,
        status: id === 'RESCUE-B' ? 'online' : 'online',
        battery_level: id === 'DRONE-01' ? 68 : id === 'RESCUE-B' ? 82 : id === 'SUPPLY-C' ? 99 : 94,
        sync_status: 'synced',
        messages_sent: 24,
        messages_received: 18,
        pending_messages: 0,
        last_seen: new Date().toISOString(),
        description: nodePositions[id]?.role || 'Mesh Field Node',
      }
    );
  };

  const selectedNode = selectedNodeId ? getNodeData(selectedNodeId) : null;

  // Manual Node Disconnect/Reconnect
  const handleToggleConnection = async (deviceId: string, currentStatus: string) => {
    try {
      setActionLoading(deviceId);
      if (currentStatus === 'online') {
        await disconnectPeer(deviceId);
      } else {
        await connectPeer(deviceId);
      }
      await fetchPeers();
    } catch (err) {
      console.error('Failed to toggle peer state:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Node Sync
  const handleTriggerSync = async (deviceId: string) => {
    try {
      setActionLoading(`sync-${deviceId}`);
      await syncPeer(deviceId);
      await fetchPeers();
    } catch (err) {
      console.error('Failed to trigger peer sync:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Animate a direct packet transfer between Rescue-A and Drone-01 or Supply-C
  const handleSendTestPacket = async () => {
    setIsSimulatingPacket(true);
    setPacketTrail('RESCUE-A -> DRONE-01 -> RESCUE-B');
    try {
      await sendPeerMessage({
        source_device_id: 'RESCUE-A',
        destination_device_id: 'RESCUE-B',
        payload_type: 'packet_ping',
        payload: JSON.stringify({ text: 'P2P Mesh Ping Test', timestamp: new Date().toISOString() }),
        priority: 3,
      });
      await fetchPeers();
    } catch (err) {
      console.error('Failed to send test packet:', err);
    } finally {
      setTimeout(() => {
        setIsSimulatingPacket(false);
      }, 2500);
    }
  };

  return (
    <div className="glass-card p-6 border border-cyan-500/20 bg-[#071328]/95 space-y-5 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              LIVE MESH NETWORK TOPOLOGY
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              P2P AD-HOC BUS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous wireless peer discovery. Nodes route emergency messages directly to each other without cellular towers or internet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTestPacket}
            disabled={isSimulatingPacket}
            className="btn-primary !text-xs !py-1.5 !px-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulatingPacket ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingPacket ? 'Transmitting Packet...' : 'Transmit Test Packet'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Network View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Mesh Canvas (Left 8 cols) */}
        <div className="lg:col-span-8 relative rounded-2xl bg-[#040b17] border border-white/[0.08] p-2 overflow-hidden shadow-inner">
          <svg
            viewBox="0 0 580 330"
            className="w-full h-[320px] select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="offlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Mesh Links between Nodes */}
            {/* Link: RESCUE-A <-> DRONE-01 */}
            <line
              x1="120"
              y1="90"
              x2="420"
              y2="70"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="6,4"
              strokeOpacity="0.6"
            />

            {/* Link: RESCUE-A <-> RESCUE-B (Affected by RESCUE-B online state) */}
            <line
              x1="120"
              y1="90"
              x2="140"
              y2="250"
              stroke={getNodeData('RESCUE-B').status === 'online' ? '#22d3ee' : '#ef4444'}
              strokeWidth={getNodeData('RESCUE-B').status === 'online' ? '2' : '1.5'}
              strokeDasharray={getNodeData('RESCUE-B').status === 'online' ? '6,4' : '3,3'}
              strokeOpacity={getNodeData('RESCUE-B').status === 'online' ? '0.7' : '0.3'}
            />

            {/* Link: DRONE-01 <-> SUPPLY-C */}
            <line
              x1="420"
              y1="70"
              x2="450"
              y2="240"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="6,4"
              strokeOpacity="0.6"
            />

            {/* Link: DRONE-01 <-> RESCUE-B */}
            <line
              x1="420"
              y1="70"
              x2="140"
              y2="250"
              stroke={getNodeData('RESCUE-B').status === 'online' ? '#38bdf8' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              strokeOpacity={getNodeData('RESCUE-B').status === 'online' ? '0.4' : '0.2'}
            />

            {/* Link: RESCUE-B <-> SUPPLY-C */}
            <line
              x1="140"
              y1="250"
              x2="450"
              y2="240"
              stroke={getNodeData('RESCUE-B').status === 'online' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              strokeOpacity={getNodeData('RESCUE-B').status === 'online' ? '0.5' : '0.2'}
            />

            {/* Animated traveling packet dots when transmitting */}
            {isSimulatingPacket && (
              <>
                <circle cx="270" cy="80" r="5" fill="#38bdf8" className="animate-ping" />
                <circle cx="280" cy="160" r="5" fill="#a855f7" className="animate-ping" />
              </>
            )}

            {/* Render 4 Mesh Nodes */}
            {Object.entries(nodePositions).map(([id, pos]) => {
              const nodeData = getNodeData(id);
              const isSelected = selectedNodeId === id;
              const isOnline = nodeData.status === 'online';
              const statusColor = isOnline
                ? nodeData.sync_status === 'pending'
                  ? '#38bdf8'
                  : '#10b981'
                : '#ef4444';

              return (
                <g
                  key={id}
                  onClick={() => setSelectedNodeId(id)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="36"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                      className="animate-spin"
                    />
                  )}

                  {/* Pulsing halo */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="28"
                    fill={statusColor}
                    fillOpacity={isOnline ? '0.12' : '0.06'}
                    stroke={statusColor}
                    strokeWidth="1.5"
                  />

                  {/* Main Node Body */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="20"
                    fill="#0a192f"
                    stroke={statusColor}
                    strokeWidth="2"
                  />

                  {/* Icon Representation */}
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    fontSize="14"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {pos.icon}
                  </text>

                  {/* Node Label Below */}
                  <rect
                    x={pos.x - 42}
                    y={pos.y + 26}
                    width="84"
                    height="18"
                    rx="9"
                    fill="#071324"
                    stroke={isSelected ? '#22d3ee' : 'rgba(255,255,255,0.1)'}
                    strokeWidth="1"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 39}
                    fill="#f1f5f9"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {id}
                  </text>

                  {/* Status Indicator Dot */}
                  <circle
                    cx={pos.x + 24}
                    cy={pos.y - 14}
                    r="5"
                    fill={statusColor}
                    stroke="#040b17"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend Overlay at bottom of canvas */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#071324]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                🟢 ONLINE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                🔴 OFFLINE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                🔵 SYNCING
              </span>
            </div>
            <span className="hidden sm:inline text-cyan-300">
              {packetTrail ? `Packet Route: ${packetTrail}` : 'Click any node to inspect telemetry'}
            </span>
          </div>
        </div>

        {/* Selected Node Telemetry Inspector (Right 4 cols) */}
        <div className="lg:col-span-4 bg-[#050c18] border border-cyan-500/20 rounded-2xl p-4 space-y-4 shadow-lg">
          {selectedNode ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-mono">
                      {selectedNode.device_id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedNode.status === 'online'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedNode.name}</p>
                </div>
              </div>

              {/* Hardware & Mesh Metrics */}
              <div className="space-y-3 text-xs font-mono">
                {/* Battery Level */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      Battery Level
                    </span>
                    <span className="text-white font-bold">{selectedNode.battery_level ?? 90}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (selectedNode.battery_level ?? 90) > 30 ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${selectedNode.battery_level ?? 90}%` }}
                    />
                  </div>
                </div>

                {/* Packet Counters */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                    <span className="text-[10px] text-slate-500 uppercase">Packets Sent</span>
                    <p className="text-base font-bold text-cyan-300">{selectedNode.messages_sent ?? 24}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                    <span className="text-[10px] text-slate-500 uppercase">Packets Received</span>
                    <p className="text-base font-bold text-violet-300">{selectedNode.messages_received ?? 18}</p>
                  </div>
                </div>

                {/* Sync Queue */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/[0.06] border border-cyan-500/20">
                  <span className="text-slate-400">Messages Waiting:</span>
                  <span className="font-bold text-amber-300">
                    {selectedNode.pending_messages ?? 0} in local store
                  </span>
                </div>

                {/* Last Seen */}
                <div className="text-[11px] text-slate-500">
                  <span>Last Seen: </span>
                  <span className="text-slate-300">
                    {selectedNode.last_seen ? new Date(selectedNode.last_seen).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2">
                <button
                  onClick={() => handleToggleConnection(selectedNode.device_id, selectedNode.status)}
                  disabled={actionLoading === selectedNode.device_id}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 ${
                    selectedNode.status === 'online'
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>
                    {actionLoading === selectedNode.device_id
                      ? 'Switching State...'
                      : selectedNode.status === 'online'
                      ? `Disconnect ${selectedNode.device_id}`
                      : `Reconnect ${selectedNode.device_id}`}
                  </span>
                </button>

                <button
                  onClick={() => handleTriggerSync(selectedNode.device_id)}
                  disabled={actionLoading === `sync-${selectedNode.device_id}` || selectedNode.status !== 'online'}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === `sync-${selectedNode.device_id}` ? 'animate-spin' : ''}`} />
                  <span>Sync Queued Messages</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              Select a node in the diagram to inspect battery, status, and queued messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
