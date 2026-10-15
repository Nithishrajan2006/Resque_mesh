import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  CheckSquare, 
  Boxes, 
  MapPin, 
  Network, 
  RefreshCw, 
  FileText,
  BatteryCharging,
  HardDrive
} from 'lucide-react';
import { DashboardStats } from '../types';

interface SidebarProps {
  stats: DashboardStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ stats }) => {
  const navItems = [
    {
      to: '/',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/incidents',
      label: 'Incident Management',
      icon: AlertTriangle,
      badge: stats?.critical_incidents ? `${stats.critical_incidents} CRIT` : (stats?.total_incidents ? `${stats.total_incidents}` : null),
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      to: '/tasks',
      label: 'Task Coordination',
      icon: CheckSquare,
      badge: stats?.active_tasks ? `${stats.active_tasks} ACT` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      to: '/inventory',
      label: 'Relief Inventory',
      icon: Boxes,
      badge: stats?.available_supply_units ? `${Math.round(stats.available_supply_units)}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      to: '/map',
      label: 'Disaster Map',
      icon: MapPin,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      to: '/peers',
      label: 'Peer Network',
      icon: Network,
      badge: stats?.online_peers ? `${stats.online_peers} ON` : null,
      badgeColor: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    },
    {
      to: '/sync',
      label: 'Sync Center',
      icon: RefreshCw,
      badge: stats?.pending_sync ? `${stats.pending_sync} QUE` : (stats?.conflicts ? `${stats.conflicts} CONF` : null),
      badgeColor: stats?.conflicts ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      to: '/audit',
      label: 'Audit & Settings',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#071120]/80 backdrop-blur-md flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2 font-mono">
            Navigation Controls
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    isActive ? 'nav-item-active' : 'nav-item-inactive'
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${item.badgeColor || 'bg-slate-700 text-slate-300'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Local Edge Device Hardware Telemetry */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20 text-xs space-y-2.5 font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            Node Battery
          </span>
          <span className="text-emerald-400 font-bold">94% (Solar)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '94%' }} />
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            Local DB
          </span>
          <span className="text-cyan-400 font-bold">SQLite Offline</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Device: <span className="text-slate-300">HQ-EDGE-NODE-01</span>
        </p>
      </div>
    </aside>
  );
};
