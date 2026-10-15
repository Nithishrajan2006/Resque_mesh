import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  RotateCcw, 
  ShieldAlert,
  Server
} from 'lucide-react';
import { loadDemo, resetDemo, checkHealth } from '../lib/api';
import { wsClient } from '../lib/websocket';

interface NavbarProps {
  onDemoLoaded?: () => void;
  onReset?: () => void;
  onOpenWorkflowModal?: () => void;
  onOpenCopilot?: () => void;
  onOpenVisuals?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onDemoLoaded, 
  onReset,
  onOpenWorkflowModal,
  onOpenCopilot,
  onOpenVisuals
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC+05:30');
    }, 1000);

    const checkApi = async () => {
      try {
        await checkHealth();
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    };
    checkApi();
    const healthInterval = setInterval(checkApi, 10000);

    const unsub = wsClient.on('connection_change', (data) => {
      setWsConnected(data.status === 'connected');
    });

    return () => {
      clearInterval(timer);
      clearInterval(healthInterval);
      unsub();
    };
  }, []);

  const handleLoadDemo = async () => {
    try {
      setLoadingAction('load');
      await loadDemo();
      if (onDemoLoaded) onDemoLoaded();
    } catch (err) {
      console.error('Failed to load demo scenario:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all disaster response data and return to clean slate?')) {
      return;
    }
    try {
      setLoadingAction('reset');
      await resetDemo();
      if (onReset) onReset();
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#071120]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base lg:text-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
              ResQMesh
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v1.0 OFF-GRID
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Decentralized Mesh & AI Disaster Response
          </p>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Offline Mode Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold">OFFLINE MODE: ZERO CLOUD</span>
        </div>

        {/* Synthetic Data Guard */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SYNTHETIC DEMO DATA</span>
        </div>

        {/* Mesh Network Health */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs">
          {wsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">Mesh Live (P2P WS)</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400 font-mono">Connecting P2P...</span>
            </>
          )}
        </div>

        {/* Local Node Health */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs">
          <Server className={`w-3.5 h-3.5 ${apiOnline ? 'text-cyan-400' : 'text-red-400'}`} />
          <span className="text-slate-300 font-mono">Node Local: {apiOnline ? 'Ready' : 'Offline'}</span>
        </div>

        {/* Emergency Time */}
        <div className="text-xs font-mono text-cyan-400/80 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20">
          🕒 {currentTime || '00:00:00 UTC'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onOpenVisuals && (
          <button
            onClick={onOpenVisuals}
            className="btn-secondary !text-xs !py-1.5 !px-3 hidden md:inline-flex border-cyan-500/40 hover:border-cyan-300 text-cyan-300"
            title="Inspect AI Visual Feeds & Mission Blueprint"
          >
            <span>📷 Visual Intel</span>
          </button>
        )}

        <button
          onClick={onOpenCopilot}
          className="btn-secondary !text-xs !py-1.5 !px-3 hidden sm:inline-flex border-violet-500/40 hover:border-violet-400 text-violet-300"
          title="Open Local AI Copilot"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span>AI Copilot</span>
        </button>

        <button
          onClick={onOpenWorkflowModal}
          className="btn-secondary !text-xs !py-1.5 !px-3 hidden sm:inline-flex border-cyan-500/30 hover:border-cyan-400 text-cyan-300"
          title="Automated 2-Minute Hackathon Demo"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>⚡ 2-Min Demo</span>
        </button>

        <button
          onClick={handleLoadDemo}
          disabled={loadingAction === 'load'}
          className="btn-primary !text-xs !py-1.5 !px-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
          title="Seed realistic Millbrook Valley disaster scenario"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'load' ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Load Scenario</span>
          <span className="sm:hidden">Reset/Load</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loadingAction === 'reset'}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 transition-all duration-200"
          title="Reset database to clean state"
        >
          <RotateCcw className={`w-4 h-4 ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
