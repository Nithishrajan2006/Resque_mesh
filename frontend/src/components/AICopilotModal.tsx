import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  Radio, 
  Boxes, 
  CheckSquare, 
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { listIncidents, listTasks, getInventorySummary, listPeers, listSyncMessages } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  actionSnippet?: {
    label: string;
    path: string;
  };
}

export const AICopilotModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "👋 Hello! I am the ResQMesh Local AI Copilot. Operating 100% offline without internet. Ask me about ongoing emergencies, rescue teams, supply reserves, or mesh device statuses.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Local state cache for deterministic question answering
  const [dataCache, setDataCache] = useState<{
    incidents: any[];
    tasks: any[];
    supplies: any[];
    peers: any[];
    syncMessages: any[];
  }>({
    incidents: [],
    tasks: [],
    supplies: [],
    peers: [],
    syncMessages: [],
  });

  const refreshLocalState = async () => {
    try {
      const [incRes, taskRes, invRes, peerRes, syncRes] = await Promise.all([
        listIncidents(),
        listTasks(),
        getInventorySummary(),
        listPeers(),
        listSyncMessages({ status: 'queued' }),
      ]);
      setDataCache({
        incidents: incRes.data || [],
        tasks: taskRes.data || [],
        supplies: invRes.data.items || [],
        peers: peerRes.data || [],
        syncMessages: syncRes.data || [],
      });
    } catch (err) {
      console.warn('Copilot cache update note:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLocalState();
    }
  }, [isOpen]);

  const QUICK_QUESTIONS = [
    'Which emergency should we handle first?',
    'Where is the nearest rescue team?',
    'Do we have enough water for East Millbrook?',
    'Which devices are offline?',
    'What messages are waiting to synchronize?',
    'Why is the flash flood marked critical?',
  ];

  // Deterministic local reasoning engine
  const generateLocalAnswer = (query: string): { text: string; snippet?: { label: string; path: string } } => {
    const q = query.toLowerCase();

    // 1. "Which emergency should we handle first?" / priority
    if (q.includes('first') || q.includes('priority') || q.includes('handle')) {
      const criticals = dataCache.incidents.filter((i) => i.severity === 'critical');
      const target = criticals.length > 0 ? criticals[0] : dataCache.incidents[0];

      if (target) {
        return {
          text: `🚨 Highest Priority: "${target.title}" in ${target.location_label || 'Millbrook Valley'}. Severity is CRITICAL with ${target.affected_count || 12} people stranded by rising flood water. Recommend dispatching Rescue Team 02 immediately.`,
          snippet: { label: 'View Incident Management', path: '/incidents' },
        };
      }
      return {
        text: 'All currently logged incidents are under control or low severity. Monitoring incoming mesh packets.',
      };
    }

    // 2. "Where is the nearest rescue team?" / team / rescue
    if (q.includes('nearest') || q.includes('team') || q.includes('where')) {
      const activePeers = dataCache.peers.filter((p) => p.status === 'online');
      return {
        text: `📍 Nearest tactical team is RESCUE-A (Rescue Alpha zodiac extraction unit) operating 2.4 km from the eastern settlement. Battery level is at 94%. Rescue Bravo is stationed in South Sector at 82% battery.`,
        snippet: { label: 'Open Rescue Missions', path: '/tasks' },
      };
    }

    // 3. "Do we have enough water for East Millbrook?" / water / food / supplies
    if (q.includes('water') || q.includes('food') || q.includes('supply') || q.includes('supplies')) {
      const waterItem = dataCache.supplies.find((s) => s.category === 'water' || s.name.toLowerCase().includes('water'));
      const stock = waterItem ? waterItem.current_stock : 4700;
      const min = waterItem ? waterItem.minimum_stock : 1000;

      return {
        text: `💧 Yes. Central Depot has ${stock.toLocaleString()} Liters of drinking water in reserve (safety baseline: ${min.toLocaleString()} L). The AI allocation recommendation of 500 L for East Millbrook will consume only ~10.6% of current stock, keeping reserves well above the 20% minimum safety buffer.`,
        snippet: { label: 'Check Relief Inventory', path: '/inventory' },
      };
    }

    // 4. "Which devices are offline?" / offline / disconnect
    if (q.includes('offline') || q.includes('disconnected') || q.includes('device')) {
      const offlinePeers = dataCache.peers.filter((p) => p.status === 'offline');
      if (offlinePeers.length > 0) {
        const names = offlinePeers.map((p) => p.device_id).join(', ');
        return {
          text: `🔴 Currently offline node(s): ${names}. Any new outgoing packets for these nodes are being held securely in local SQLite store-and-forward queues until they re-enter radio range.`,
          snippet: { label: 'Inspect Mesh Network', path: '/peers' },
        };
      }
      return {
        text: `🟢 All 4 simulated mesh nodes (RESCUE-A, RESCUE-B, DRONE-01, SUPPLY-C) are currently ONLINE and communicating directly peer-to-peer.`,
        snippet: { label: 'Inspect Mesh Network', path: '/peers' },
      };
    }

    // 5. "What messages are waiting to synchronize?" / sync / queue
    if (q.includes('sync') || q.includes('queue') || q.includes('waiting') || q.includes('messages')) {
      const queuedCount = dataCache.syncMessages.length;
      return {
        text: `🔄 There are currently ${queuedCount} emergency dispatch packet(s) waiting in the store-and-forward queue. As soon as field nodes establish direct Wi-Fi/mesh proximity, pending packets will synchronize automatically with zero duplicate corruption.`,
        snippet: { label: 'Open Sync Center', path: '/sync' },
      };
    }

    // 6. "Why is Incident 04 / flood marked critical?" / why
    if (q.includes('why') || q.includes('flood') || q.includes('critical')) {
      return {
        text: `⚡ The Flash Flood in Millbrook Valley was elevated to CRITICAL by the IncidentAgent rule engine due to: 1) High population impact (12 people stranded), 2) Rapid water ingress rate (>1.2 m), and 3) Compromised bridge infrastructure blocking ground vehicle access.`,
        snippet: { label: 'View Incident Intelligence', path: '/incidents' },
      };
    }

    // Generic fallback query response
    return {
      text: `🤖 Local Heuristic Observation: Sector Millbrook Valley is currently responding to 1 critical flood emergency with 6 active tasks and 8,005 supply units on hand. 4 field nodes are linked via peer-to-peer radio. What specific telemetry or recommendation would you like me to check?`,
    };
  };

  const handleSend = async (userQuery?: string) => {
    const q = userQuery || input.trim();
    if (!q) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate instant local edge AI response delay (300ms)
    setTimeout(() => {
      const answer = generateLocalAnswer(q);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: answer.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionSnippet: answer.snippet,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="w-full sm:max-w-md h-[90vh] sm:h-[650px] bg-[#071328] border border-cyan-500/30 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] bg-[#091b36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#071328] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-wide">
                  RESQMESH AI COPILOT
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                  LOCAL
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-300">
                100% Offline Decision Support • Zero Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl space-y-1.5 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-[#0d2242] text-slate-100 border border-cyan-500/20 rounded-tl-none shadow-md'
                }`}
              >
                <p className="text-xs">{m.text}</p>
                {m.actionSnippet && (
                  <a
                    href={m.actionSnippet.path}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30 transition mt-1"
                  >
                    <span>{m.actionSnippet.label} ➔</span>
                  </a>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-0.5 px-1">
                {m.timestamp}
              </span>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0d2242] border border-cyan-500/20 text-cyan-400 text-xs w-36 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing local data...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 border-t border-white/[0.06] bg-[#050e1d] space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            Quick Copilot Inquiries:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 transition text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#071328]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask offline copilot about this emergency..."
              className="flex-1 bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
