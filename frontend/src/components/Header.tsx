import React from 'react';
import { Shield, Clock, Activity, Radio, UserCheck, AlertTriangle } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  simulatedClock: string;
  scenarioName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  simulatedClock,
  scenarioName
}) => {
  const roleBadges: Record<UserRole, { label: string; color: string; desc: string }> = {
    admin: { label: 'Administrator', color: 'bg-purple-900/60 text-purple-200 border-purple-500/40', desc: 'Full PMRDA System Authority' },
    operator: { label: 'Traffic Operator', color: 'bg-blue-900/60 text-blue-200 border-blue-500/40', desc: 'Control Room Dispatch' },
    commuter: { label: 'Commuter', color: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40', desc: 'Standard Journey Planner' },
    emergency: { label: '108 Emergency', color: 'bg-rose-900/60 text-rose-200 border-rose-500/40', desc: 'Priority Corridor Access' }
  };

  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
      {/* Brand & City focus */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
              SMART CITY TRAFFIC
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                PUNE
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Hinjawadi Rajiv Gandhi Infotech Park • Route Optimization & Traffic Control
          </p>
        </div>
      </div>

      {/* Center status: Simulation & Clock */}
      <div className="flex items-center gap-3">
        {/* Simulation mode indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span className="font-semibold tracking-wide uppercase">Simulation Mode</span>
          <span className="text-amber-400/60">•</span>
          <span className="truncate max-w-[140px] text-amber-200">{scenarioName}</span>
        </div>

        {/* Simulated clock */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{simulatedClock} IST</span>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Access Profile</span>
          <span className="text-xs text-slate-300 font-medium">{roleBadges[currentRole].desc}</span>
        </div>

        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer ${roleBadges[currentRole].color}`}
          title="Switch Active Access Role"
        >
          <option value="commuter">Commuter</option>
          <option value="operator">Traffic Operator</option>
          <option value="emergency">108 Emergency Services</option>
          <option value="admin">Administrator (PMRDA)</option>
        </select>
      </div>
    </header>
  );
};
