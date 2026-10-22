import React, { useEffect, useState } from 'react';
import { TrafficMap } from '../features/map/TrafficMap';
import { ScenarioController } from '../components/ScenarioController';
import { api } from '../services/api';
import { RoadNode, RoadSegment, Incident, RouteResult, SimulationScenario, TrafficSignal, UserRole } from '../types';
import { Route, Navigation, AlertTriangle, Layers, RefreshCw, Compass } from 'lucide-react';

interface LiveMapPageProps {
  currentRole: UserRole;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({ currentRole }) => {
  const [nodes, setNodes] = useState<RoadNode[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('morning_peak');
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);

  const [originId, setOriginId] = useState<string>('wakad_flyover');
  const [destId, setDestId] = useState<string>('megapolis_ph3');
  const [objective, setObjective] = useState<string>('congestion_aware');

  const [showCongestion, setShowCongestion] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [n, r, inc, sig, sc, cur] = await Promise.all([
        api.getNodes(),
        api.getRoads(),
        api.getIncidents(),
        api.getSignals(),
        api.getScenarios(),
        api.getCurrentSimulation()
      ]);
      setNodes(n);
      setRoads(r);
      setIncidents(inc);
      setSignals(sig);
      setScenarios(sc);
      if (cur?.active_scenario?.id) {
        setActiveScenarioId(cur.active_scenario.id);
      }
    } catch (err) {
      console.error("Failed to load map data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScenarioSelect = async (scenarioId: string) => {
    setLoading(true);
    try {
      await api.setScenario(scenarioId);
      setActiveScenarioId(scenarioId);
      // Refresh road speeds and recalculate route if active
      const updatedRoads = await api.getRoads();
      setRoads(updatedRoads);
      if (originId && destId) {
        handleCalculateRoute();
      }
    } catch (err) {
      console.error("Failed to switch scenario:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRoute = async () => {
    if (!originId || !destId || originId === destId) return;
    setLoading(true);
    try {
      const route = await api.optimizeRoute({
        origin_id: originId,
        destination_id: destId,
        objective: currentRole === 'emergency' ? 'emergency_priority' : objective,
        user_role: currentRole
      });
      setActiveRoute(route);
    } catch (err) {
      console.error("Route calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const originNode = nodes.find(n => n.id === originId);
  const destNode = nodes.find(n => n.id === destId);
  const originCoords: [number, number] | null = originNode ? [originNode.latitude, originNode.longitude] : null;
  const destCoords: [number, number] | null = destNode ? [destNode.latitude, destNode.longitude] : null;

  return (
    <div className="p-4 sm:p-6 space-y-4 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Top Scenario Switcher */}
      <ScenarioController
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleScenarioSelect}
        isLoading={loading}
      />

      {/* Main Map Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left Side Quick Route & Layer Console */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 overflow-y-auto custom-scrollbar shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-200">Quick Route Solver</h3>
              </div>
              <button
                onClick={loadData}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Refresh Map State"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Origin & Destination pickers */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Origin (Green Pin A)
                </label>
                <select
                  value={originId}
                  onChange={e => setOriginId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Destination (Red Pin B)
                </label>
                <select
                  value={destId}
                  onChange={e => setDestId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              {currentRole !== 'emergency' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Optimization Profile
                  </label>
                  <select
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="congestion_aware">Congestion-Aware (Recommended)</option>
                    <option value="fastest_time">Fastest Travel Time</option>
                    <option value="shortest_distance">Shortest Physical Distance</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleCalculateRoute}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>{loading ? 'Optimizing Route...' : 'Calculate Optimal Route'}</span>
              </button>
            </div>

            {/* Active Route Result Card */}
            {activeRoute && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">{activeRoute.objective_label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {activeRoute.computation_latency_ms} ms
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block">Duration</span>
                    <span className="text-base font-extrabold text-white">
                      {activeRoute.estimated_travel_time_minutes} <span className="text-xs font-normal">min</span>
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block">Distance</span>
                    <span className="text-base font-extrabold text-white">
                      {activeRoute.total_distance_km} <span className="text-xs font-normal">km</span>
                    </span>
                  </div>
                </div>
                {activeRoute.estimated_time_savings_pct > 0 && (
                  <p className="text-[11px] text-emerald-400 font-semibold text-center">
                    Saves ~{activeRoute.estimated_time_savings_pct}% time over congested baseline!
                  </p>
                )}
                <p className="text-[11px] text-slate-400 leading-tight">
                  {activeRoute.recommendation_reason}
                </p>
              </div>
            )}
          </div>

          {/* Layer toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Map Layers</span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Traffic Congestion Overlay</span>
              <input
                type="checkbox"
                checked={showCongestion}
                onChange={e => setShowCongestion(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Active Incident Alerts</span>
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={e => setShowIncidents(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Center / Right Full Map */}
        <div className="lg:col-span-3 h-full min-h-[450px]">
          <TrafficMap
            nodes={nodes}
            roads={roads}
            incidents={incidents}
            signals={signals}
            activeRoute={activeRoute}
            originCoords={originCoords}
            destCoords={destCoords}
            showCongestion={showCongestion}
            showIncidents={showIncidents}
          />
        </div>
      </div>
    </div>
  );
};
