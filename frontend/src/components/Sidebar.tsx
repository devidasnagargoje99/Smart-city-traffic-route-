import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Route,
  Siren,
  TrafficCone,
  Sliders,
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentRole: UserRole;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'operator', 'commuter', 'emergency'] },
    { to: '/map', label: 'Live Traffic Map', icon: MapPin, roles: ['admin', 'operator', 'commuter', 'emergency'] },
    { to: '/routes', label: 'Route Planner', icon: Route, roles: ['admin', 'operator', 'commuter', 'emergency'] },
    { to: '/emergency', label: 'Emergency Priority', icon: Siren, roles: ['admin', 'operator', 'emergency'], badge: '108 EMS' },
    { to: '/incidents', label: 'Incident Management', icon: TrafficCone, roles: ['admin', 'operator'] },
    { to: '/signals', label: 'Smart Signals', icon: Sliders, roles: ['admin', 'operator'] },
    { to: '/analytics', label: 'Analytics & AI', icon: BarChart3, roles: ['admin', 'operator', 'commuter'] },
    { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'operator', 'commuter', 'emergency'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Navigation
          </p>
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Focus Corridor Info Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-300">
            <span>Corridor Focus</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Hinjawadi Phase 1, Phase 2, Phase 3, Wakad, Bhumkar Chowk, Dange Chowk & NH48 Expressway.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50">
            <span>Graph Nodes: 21</span>
            <span>OSM Hinjawadi</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>v1.0.0 • Pune Smart City</span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">IST +05:30</span>
      </div>
    </aside>
  );
};
