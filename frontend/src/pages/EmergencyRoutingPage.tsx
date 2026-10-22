import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RoadNode, RoadSegment, Incident, RouteResult, UserRole } from '../types';
import { TrafficMap } from '../features/map/TrafficMap';
import { Siren, ShieldAlert, Zap, Compass, AlertOctagon, CheckCircle2, Navigation } from 'lucide-react';

interface EmergencyRoutingPageProps {
  currentRole: UserRole;
}

export const EmergencyRoutingPage: React.FC<EmergencyRoutingPageProps> = ({ currentRole }) => {
  const [nodes, setNodes] = useState<RoadNode[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [originId, setOriginId] = useState<string>('baner_junction'); // Near Jupiter Hospital / Highway
  const [destId, setDestId] = useState<string>('megapolis_ph3');      // Deep in Phase 3
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [n, r, inc] = await Promise.all([
          api.getNodes(),
          api.getRoads(),
          api.getIncidents()
        ]);
        setNodes(n);
        setRoads(r);
        setIncidents(inc);
      } catch (err) {
        console.error("Failed to load emergency data:", err);
      }
    };
    init();
  }, []);

  const handleCalculateEmergencyRoute = async () => {
    if (!originId || !destId || originId === destId) return;
    setLoading(true);
    try {
      const res = await api.optimizeRoute({
        origin_id: originId,
        destination_id: destId,
        objective: 'emergency_priority',
        user_role: 'emergency'
      });
      setRoute(res);
    } catch (err) {
      console.error("Emergency route error:", err);
    } finally {
      setLoading(false);
    }
  };

  const originNode = nodes.find(n => n.id === originId);
  const destNode = nodes.find(n => n.id === destId);
  const originCoords: [number, number] | null = originNode ? [originNode.latitude, originNode.longitude] : null;
  const destCoords: [number, number] | null = destNode ? [destNode.latitude, destNode.longitude] : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title with Emergency Beacon */}
      <div className="flex items-center justify-between border-b border-rose-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Siren className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                108 Emergency Priority Corridor Console
              </h2>
              <p className="text-xs text-rose-300/80">
                Authorized Rapid Emergency Response • Hinjawadi IT Corridor, Pune
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          Priority Clearance Active
        </div>
      </div>

      {/* Origin / Destination Picker */}
      <div className="bg-slate-900 border border-rose-900/30 rounded-2xl p-4 sm:p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-rose-300 block mb-1.5">
            Emergency Dispatch Base / Hospital
          </label>
          <select
            value={originId}
            onChange={e => setOriginId(e.target.value)}
            className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-rose-300 block mb-1.5">
            Emergency Target Location
          </label>
          <select
            value={destId}
            onChange={e => setDestId(e.target.value)}
            className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleCalculateEmergencyRoute}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Clearing Corridor...' : 'Solve Priority Corridor'}</span>
          </button>
        </div>
      </div>

      {/* Route & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Dispatch Detail */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Navigation className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base text-white">Emergency Dispatch Telemetry</h3>
          </div>

          {route ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <span className="text-[10px] uppercase text-rose-300 block font-semibold">Priority ETA</span>
                  <span className="text-2xl font-black text-white">
                    {route.estimated_travel_time_minutes} <span className="text-xs font-normal">min</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Distance</span>
                  <span className="text-2xl font-black text-white">
                    {route.total_distance_km} <span className="text-xs font-normal">km</span>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Standard Commute ETA:</span>
                  <span className="font-semibold">{route.baseline_travel_time_minutes} min</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Estimated Time Saved:</span>
                  <span>~{Math.round(route.baseline_travel_time_minutes - route.estimated_travel_time_minutes)} min</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Routing Latency:</span>
                  <span className="font-mono">{route.computation_latency_ms} ms</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 leading-relaxed text-[11px]">
                <strong>Operator Protocol:</strong> Emergency route models priority vehicle clearance while strictly adhering to confirmed physical blockades. Signal green waves should be coordinated via the Smart Signal module.
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Siren className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-500" />
              <p>Select origin and destination to solve prioritized emergency corridor.</p>
            </div>
          )}
        </div>

        {/* Right Map */}
        <div className="lg:col-span-2 h-[480px]">
          <TrafficMap
            nodes={nodes}
            roads={roads}
            incidents={incidents}
            activeRoute={route}
            originCoords={originCoords}
            destCoords={destCoords}
          />
        </div>
      </div>
    </div>
  );
};
