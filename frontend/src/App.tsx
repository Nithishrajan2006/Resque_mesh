import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoWorkflowModal } from './components/DemoWorkflowModal';
import { TwoMinuteDemoModal } from './components/TwoMinuteDemoModal';
import { AICopilotModal } from './components/AICopilotModal';
import { CommandCenter } from './pages/CommandCenter';
import { Incidents } from './pages/Incidents';
import { Tasks } from './pages/Tasks';
import { Inventory } from './pages/Inventory';
import { DisasterMap } from './pages/DisasterMap';
import { PeerNetwork } from './pages/PeerNetwork';
import { SyncCenter } from './pages/SyncCenter';
import { AuditSettings } from './pages/AuditSettings';
import { getDashboardStats } from './lib/api';
import { wsClient } from './lib/websocket';
import { DashboardStats } from './types';

export function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [isTwoMinuteDemoOpen, setIsTwoMinuteDemoOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    const unsubs = [
      wsClient.on('incident_created', fetchStats),
      wsClient.on('incident_updated', fetchStats),
      wsClient.on('task_created', fetchStats),
      wsClient.on('task_approved', fetchStats),
      wsClient.on('inventory_updated', fetchStats),
      wsClient.on('peer_connected', fetchStats),
      wsClient.on('peer_disconnected', fetchStats),
      wsClient.on('demo_loaded', fetchStats),
      wsClient.on('demo_step', fetchStats),
      wsClient.on('demo_reset', fetchStats),
    ];

    return () => {
      clearInterval(interval);
      unsubs.forEach((u) => u());
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#050d1a] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar
          onDemoLoaded={fetchStats}
          onReset={fetchStats}
          onOpenWorkflowModal={() => setIsTwoMinuteDemoOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        <div className="flex-1 flex min-w-0">
          <Sidebar 
            stats={stats} 
            onOpenCopilot={() => setIsCopilotOpen(true)}
          />

          <main className="flex-1 min-w-0 pb-16">
            <Routes>
              <Route
                path="/"
                element={
                  <CommandCenter
                    onOpenWorkflow={() => setIsTwoMinuteDemoOpen(true)}
                  />
                }
              />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/map" element={<DisasterMap />} />
              <Route path="/peers" element={<PeerNetwork />} />
              <Route path="/sync" element={<SyncCenter />} />
              <Route path="/audit" element={<AuditSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Floating AI Copilot Trigger */}
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-2xl shadow-violet-500/30 transition transform hover:scale-105 group border border-white/20"
          title="Open ResQMesh Local AI Copilot"
        >
          <Bot className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition" />
          <span className="font-mono">AI Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* 2-Minute Automated Demo Runner */}
        <TwoMinuteDemoModal
          isOpen={isTwoMinuteDemoOpen}
          onClose={() => setIsTwoMinuteDemoOpen(false)}
          onComplete={fetchStats}
        />

        {/* Step-by-Step E2E Workflow Modal */}
        <DemoWorkflowModal
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          onWorkflowComplete={fetchStats}
        />

        {/* AI Copilot Interactive Modal */}
        <AICopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </div>
    </Router>
  );
}

export default App;
