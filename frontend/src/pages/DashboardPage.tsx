import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardOverview, Incident, SimulationScenario, UserRole } from '../types';
import { ScenarioController } from '../components/ScenarioController';
import {
  Activity,
  AlertTriangle,
  Clock,
  Compass,
  Gauge,
  Layers,
  MapPin,
  Route,
  ShieldCheck,
  Siren,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardPageProps {
  currentRole: UserRole;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentRole }) => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('morning_peak');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [ov, inc, sc, cur] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getIncidents(),
        api.getScenarios(),
        api.getCurrentSimulation()
      ]);
      setOverview(ov);
      setIncidents(inc);
      setScenarios(sc);
      if (cur?.active_scenario?.id) {
        setActiveScenarioId(cur.active_scenario.id);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleScenarioSelect = async (scenarioId: string) => {
    setLoading(true);
    try {
      await api.setScenario(scenarioId);
      setActiveScenarioId(scenarioId);
      await fetchData();
    } catch (err) {
      console.error("Failed to switch scenario:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* City & Corridor Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Pune Smart City Traffic Operations Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rajiv Gandhi Infotech Park, Hinjawadi • Real-Time Congestion, Dynamic Routing & Incident Control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/map"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Live Map</span>
          </Link>
          <Link
            to="/routes"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Route className="w-4 h-4" />
            <span>Route Planner</span>
          </Link>
        </div>
      </div>

      {/* Scenario Controller */}
      <ScenarioController
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleScenarioSelect}
        isLoading={loading}
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Monitored segments */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monitored Roads</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {overview?.total_monitored_segments || 27}
            </span>
            <span className="text-xs text-slate-400">segments</span>
          </div>
          <p className="text-[11px] text-slate-500">Hinjawadi Ph 1/2/3 & NH48</p>
        </div>

        {/* Congested segments */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bottlenecks</span>
            <Gauge className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
              {overview?.current_congested_segments || 0}
            </span>
            <span className="text-xs text-slate-400">chokepoints</span>
          </div>
          <p className="text-[11px] text-slate-500">Speeds &lt; 40% free flow</p>
        </div>

        {/* Active incidents */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {overview?.active_incidents || 0}
            </span>
            <span className="text-xs text-slate-400">reported</span>
          </div>
          <p className="text-[11px] text-slate-500">Affecting graph traversability</p>
        </div>

        {/* Average Travel Time */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Network Delay</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              +{Math.round((overview?.estimated_network_delay_sec || 0) / 60)}
            </span>
            <span className="text-xs text-slate-400">min cumulative</span>
          </div>
          <p className="text-[11px] text-slate-500">Above baseline free-flow</p>
        </div>
      </div>

      {/* Middle Layout: Incidents feed & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incident List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Active Traffic Incidents & Road Restrictions</h3>
            </div>
            <Link to="/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {incidents.filter(i => i.status !== 'resolved').slice(0, 4).map(inc => (
              <div
                key={inc.id}
                className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{inc.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inc.severity === 'critical' || inc.severity === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {inc.severity}
                    </span>
                    {inc.verified && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{inc.description}</p>
                </div>

                <div className="text-right sm:shrink-0 text-slate-300 font-mono">
                  <span>+{Math.round(inc.delay_penalty_sec / 60)} min delay</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launch & System Health */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">System Integrity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400">Database Engine</span>
              <span className="font-semibold text-slate-200">SQLite / PostgreSQL Ready</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400">Routing Algorithms</span>
              <span className="font-semibold text-indigo-300">NetworkX A* & Dijkstra</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400">AI Traffic Prediction</span>
              <span className="font-semibold text-emerald-300">Scikit-Learn ML Model</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400">Map Service</span>
              <span className="font-semibold text-slate-200">OpenStreetMap / CARTO</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/emergency"
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Siren className="w-4 h-4 text-rose-400" />
              <span>Launch 108 Emergency Dispatch Console</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
