import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoWorkflowModal } from './components/DemoWorkflowModal';
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
          onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar stats={stats} />

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <CommandCenter
                    onOpenWorkflow={() => setIsWorkflowModalOpen(true)}
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

        <DemoWorkflowModal
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          onWorkflowComplete={fetchStats}
        />
      </div>
    </Router>
  );
}

export default App;
