import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Network, 
  Wifi, 
  WifiOff, 
  Send, 
  RefreshCw, 
  Plus, 
  Radio, 
  ShieldCheck, 
  Server, 
  Layers, 
  ArrowRightLeft, 
  X,
  BatteryCharging,
  Clock,
  AlertTriangle,
  CheckSquare,
  Boxes,
  Zap
} from 'lucide-react';
import { 
  listPeers, 
  createPeer, 
  connectPeer, 
  disconnectPeer, 
  syncPeer, 
  sendPeerMessage, 
  getNetworkStatus 
} from '../lib/api';
import { Peer } from '../types';

export const PeerNetwork: React.FC = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [networkStatus, setNetworkStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Send message modal
  const [isMsgModalOpen, setIsMsgModalOpen] = useState<boolean>(false);
  const [msgData, setMsgData] = useState({
    source_device_id: 'rescue-alpha',
    destination_device_id: 'rescue-bravo',
    payload_type: 'incident_alert',
    payload: JSON.stringify({ alert: 'Flash flood cresting in 30 mins', priority: 'high' }),
    priority: 2,
  });

  // Register peer modal
  const [isPeerModalOpen, setIsPeerModalOpen] = useState<boolean>(false);
  const [newPeer, setNewPeer] = useState({
    device_id: 'medic-van-1',
    name: 'Mobile Clinic Bravo',
    description: 'Field paramedic triage unit',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [peersRes, netRes] = await Promise.all([
        listPeers(),
        getNetworkStatus(),
      ]);
      setPeers(peersRes.data);
      setNetworkStatus(netRes.data);
    } catch (err) {
      console.error('Failed to fetch peer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async (deviceId: string) => {
    try {
      await connectPeer(deviceId);
      fetchData();
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      await disconnectPeer(deviceId);
      fetchData();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handleSync = async (deviceId: string) => {
    try {
      const res = await syncPeer(deviceId);
      alert(`Synchronized ${res.data.messages_delivered} queued messages with ${deviceId}`);
      fetchData();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPeerMessage(msgData);
      setIsMsgModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleCreatePeer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPeer(newPeer);
      setIsPeerModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Peer creation failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <Network className="w-5 h-5 text-violet-400" />
            PEER-TO-PEER MESH TOPOLOGY
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate ad-hoc radio dropouts, packet relaying, store-and-forward routing, and idempotent rejoin synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMsgModalOpen(true)}
            className="btn-primary !text-xs !py-2 !px-3 bg-gradient-to-r from-violet-500 to-cyan-500"
          >
            <Send className="w-4 h-4" />
            <span>Transmit Mesh Packet</span>
          </button>
          <button
            onClick={() => setIsPeerModalOpen(true)}
            className="btn-secondary !text-xs !py-2 !px-3"
          >
            <Plus className="w-4 h-4" />
            <span>Register Edge Node</span>
          </button>
        </div>
      </div>

      {/* Network Status Overview Card */}
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Mesh Health</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                networkStatus?.network_health === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-lg font-bold text-white capitalize font-mono">
              {networkStatus?.network_health || 'Analyzing...'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Online Field Nodes</span>
          <div className="text-lg font-bold text-cyan-300 font-mono">
            {networkStatus?.online_peers ?? 0} / {networkStatus?.total_peers ?? 0}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Queued in Mesh Memory</span>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {networkStatus?.queued_messages ?? 0} Packets
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Routing Protocol</span>
          <div className="text-sm font-bold text-violet-300 font-mono">
            Multi-Hop Store & Forward
          </div>
        </div>
      </div>

      {/* Emergency Node Operations Toolbar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-black/40 to-cyan-950/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Mesh Node Operations & Task Coordination:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Link
            to="/incidents"
            className="btn-secondary !text-xs !py-1.5 !px-3 text-red-300 border-red-500/30 hover:border-red-400 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Report Incident</span>
          </Link>
          <Link
            to="/tasks"
            className="btn-secondary !text-xs !py-1.5 !px-3 text-amber-300 border-amber-500/30 hover:border-amber-400 flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Assign Tasks</span>
          </Link>
          <Link
            to="/inventory"
            className="btn-secondary !text-xs !py-1.5 !px-3 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modify Stock</span>
          </Link>
          <button
            onClick={() => setIsMsgModalOpen(true)}
            className="btn-primary !text-xs !py-1.5 !px-3 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Packet</span>
          </button>
        </div>
      </div>

      {/* Simulated Network Topology Visualizer */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Mesh Radio Propagation & Inter-Node Links (4 Active Nodes)
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            DETERMINISTIC SIMULATION
          </span>
        </div>

        {/* Visual Topology Diagram */}
        <div className="py-6 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-black/40 rounded-2xl border border-white/[0.05] relative overflow-hidden">
          {peers.map((peer) => {
            const isOnline = peer.status === 'online';
            return (
              <div
                key={peer.id}
                className={`relative flex flex-col justify-between gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                  isOnline
                    ? 'bg-cyan-500/[0.06] border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-red-500/[0.04] border-red-500/30 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-md ${
                      isOnline
                        ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 ring-2 ring-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-red-500/40'
                    }`}
                  >
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 text-red-400" />}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isOnline ? 'LINK ACTIVE' : 'DISCONNECTED'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white truncate">{peer.name}</div>
                  <div className="text-[10px] font-mono text-cyan-400">{peer.device_id}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{peer.description}</p>
                </div>

                {/* Battery percentage */}
                <div className="w-full space-y-1 font-mono pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      Battery Level:
                    </span>
                    <span className="text-emerald-300 font-bold">{peer.battery_level ?? 85}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (peer.battery_level ?? 85) > 50 ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${peer.battery_level ?? 85}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="text-[10px] font-mono text-slate-400 space-y-1 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span>Sync State:</span>
                    <span className={peer.pending_messages > 0 ? 'text-amber-300 font-bold' : 'text-cyan-300 font-bold'}>
                      {peer.pending_messages > 0 ? `${peer.pending_messages} IN QUEUE` : 'SYNCHRONIZED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Tx: {peer.messages_sent} | Rx: {peer.messages_received}</span>
                    <span>{peer.last_seen ? new Date(peer.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
                  </div>
                </div>

                {/* Node Quick Action Controls */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06] flex-wrap">
                  {isOnline ? (
                    <button
                      onClick={() => handleDisconnect(peer.device_id)}
                      className="flex-1 py-1 px-2 rounded text-[10px] font-mono bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition text-center"
                      title="Simulate signal dropout"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(peer.device_id)}
                      className="flex-1 py-1 px-2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition text-center"
                    >
                      Reconnect
                    </button>
                  )}

                  <button
                    onClick={() => handleSync(peer.device_id)}
                    className="py-1 px-2 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition text-center"
                    title="Deliver pending store-and-forward messages"
                  >
                    Sync
                  </button>

                  <button
                    onClick={() => {
                      setMsgData((prev) => ({ ...prev, destination_device_id: peer.device_id }));
                      setIsMsgModalOpen(true);
                    }}
                    className="py-1 px-2 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition text-center"
                    title="Send direct packet"
                  >
                    Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peers Table */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Registered Edge Node Devices ({peers.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th className="p-3">Device ID</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Link Status</th>
                <th className="p-3">Battery</th>
                <th className="p-3">Sync Status</th>
                <th className="p-3">Pending</th>
                <th className="p-3">Packets Sent/Recv</th>
                <th className="p-3">Last Seen</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {peers.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="p-3 text-cyan-300 font-bold">{p.device_id}</td>
                  <td className="p-3 text-white font-medium">{p.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'online'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-300 font-bold">
                    {p.battery_level ?? 85}%
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold ${p.pending_messages > 0 ? 'text-amber-300' : 'text-cyan-300'}`}>
                      {p.pending_messages > 0 ? 'QUEUED' : 'SYNCHRONIZED'}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.pending_messages > 0 ? (
                      <span className="text-amber-300 font-bold">{p.pending_messages} queued</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">
                    {p.messages_sent} ↑ / {p.messages_received} ↓
                  </td>
                  <td className="p-3 text-slate-500">
                    {p.last_seen ? new Date(p.last_seen).toLocaleTimeString() : 'Live'}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {p.status === 'online' ? (
                      <button
                        onClick={() => handleDisconnect(p.device_id)}
                        className="btn-danger !text-[10px] !py-0.5 !px-2"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(p.device_id)}
                        className="btn-success !text-[10px] !py-0.5 !px-2"
                      >
                        Connect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Transmit Mesh Message */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Transmit Store-and-Forward Mesh Packet
              </h2>
              <button onClick={() => setIsMsgModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Source Node</label>
                  <select
                    value={msgData.source_device_id}
                    onChange={(e) => setMsgData({ ...msgData, source_device_id: e.target.value })}
                    className="select-field"
                  >
                    {peers.map((p) => (
                      <option key={p.id} value={p.device_id}>
                        {p.name} ({p.device_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Destination Node</label>
                  <select
                    value={msgData.destination_device_id}
                    onChange={(e) => setMsgData({ ...msgData, destination_device_id: e.target.value })}
                    className="select-field"
                  >
                    {peers.map((p) => (
                      <option key={p.id} value={p.device_id}>
                        {p.name} ({p.device_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Payload Schema</label>
                  <select
                    value={msgData.payload_type}
                    onChange={(e) => setMsgData({ ...msgData, payload_type: e.target.value })}
                    className="select-field"
                  >
                    <option value="incident_alert">Incident Alert</option>
                    <option value="task_assignment">Task Assignment</option>
                    <option value="supply_requisition">Supply Requisition</option>
                    <option value="network_ping">Telemetry Ping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Packet Priority (1=Highest)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={msgData.priority}
                    onChange={(e) => setMsgData({ ...msgData, priority: parseInt(e.target.value) || 5 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payload JSON Content</label>
                <textarea
                  rows={3}
                  value={msgData.payload}
                  onChange={(e) => setMsgData({ ...msgData, payload: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMsgModalOpen(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs">
                  Inject into Mesh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Edge Node */}
      {isPeerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full bg-[#0a1628] border-white/20 p-6 space-y-4 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Register Field Edge Device
              </h2>
              <button onClick={() => setIsPeerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Unique Device ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. drone-survey-1"
                  value={newPeer.device_id}
                  onChange={(e) => setNewPeer({ ...newPeer, device_id: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Unit Call Sign / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aerial Recon Drone"
                  value={newPeer.name}
                  onChange={(e) => setNewPeer({ ...newPeer, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Sector</label>
                <input
                  type="text"
                  placeholder="Role, hardware model, radio band"
                  value={newPeer.description}
                  onChange={(e) => setNewPeer({ ...newPeer, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPeerModalOpen(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary !text-xs">
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
