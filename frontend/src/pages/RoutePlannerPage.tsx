import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RoadNode, RoadSegment, Incident, RouteResult, RouteCompareResponse, UserRole } from '../types';
import { TrafficMap } from '../features/map/TrafficMap';
import { Compass, Clock, MapPin, Gauge, ShieldCheck, ArrowRight, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface RoutePlannerPageProps {
  currentRole: UserRole;
}

export const RoutePlannerPage: React.FC<RoutePlannerPageProps> = ({ currentRole }) => {
  const [nodes, setNodes] = useState<RoadNode[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [originId, setOriginId] = useState<string>('wakad_flyover');
  const [destId, setDestId] = useState<string>('megapolis_ph3');

  const [compareResult, setCompareResult] = useState<RouteCompareResponse | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const initData = async () => {
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
        console.error("Failed to load planner data:", err);
      }
    };
    initData();
  }, []);

  const handleRunComparison = async () => {
    if (!originId || !destId || originId === destId) return;
    setLoading(true);
    try {
      const res = await api.compareRoutes({
        origin_id: originId,
        destination_id: destId,
        user_role: currentRole
      });
      setCompareResult(res);
      setSelectedRouteIndex(0);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeRoute: RouteResult | null = compareResult && compareResult.routes[selectedRouteIndex]
    ? compareResult.routes[selectedRouteIndex]
    : null;

  const originNode = nodes.find(n => n.id === originId);
  const destNode = nodes.find(n => n.id === destId);
  const originCoords: [number, number] | null = originNode ? [originNode.latitude, originNode.longitude] : null;
  const destCoords: [number, number] | null = destNode ? [destNode.latitude, destNode.longitude] : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Compass className="w-6 h-6 text-indigo-400" />
          Hinjawadi Route Optimizer & Multi-Objective Comparison
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Evaluate real-world road graph travel times, alternative corridors, and congestion exposure between Pune hubs.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Origin Landmark / Junction
          </label>
          <select
            value={originId}
            onChange={e => setOriginId(e.target.value)}
            className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Destination Landmark / Junction
          </label>
          <select
            value={destId}
            onChange={e => setDestId(e.target.value)}
            className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleRunComparison}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Solving Graph Network...' : 'Analyze & Compare Routes'}</span>
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {compareResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{compareResult.summary_explanation}</span>
            <span className="font-mono text-indigo-400">Algorithm: NetworkX A* / Dijkstra</span>
          </div>

          {/* Cards for each objective */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {compareResult.routes.map((rt, idx) => {
              const isSelected = idx === selectedRouteIndex;
              return (
                <div
                  key={rt.route_id}
                  onClick={() => setSelectedRouteIndex(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {rt.objective_label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-lg text-white">
                      {rt.estimated_travel_time_minutes} <span className="text-xs font-normal text-slate-400">minutes</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Distance: <span className="text-slate-200 font-semibold">{rt.total_distance_km} km</span>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-700/50 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Congestion Exposure:</span>
                      <span className={`font-semibold ${rt.congestion_exposure_pct > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {rt.congestion_exposure_pct}%
                      </span>
                    </div>
                    {rt.estimated_time_savings_pct !== 0 && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Time vs Baseline:</span>
                        <span className={`font-semibold ${rt.estimated_time_savings_pct > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {rt.estimated_time_savings_pct > 0 ? `+${rt.estimated_time_savings_pct}% faster` : `${rt.estimated_time_savings_pct}%`}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-300 leading-snug italic pt-1">
                      "{rt.recommendation_reason}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Map & Route Geometry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            <div className="lg:col-span-2 h-[450px]">
              <TrafficMap
                nodes={nodes}
                roads={roads}
                incidents={incidents}
                activeRoute={activeRoute}
                originCoords={originCoords}
                destCoords={destCoords}
              />
            </div>

            {/* Turn by turn segments accordion */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Turn Guidance & Segments ({activeRoute?.segments.length || 0})
                </span>
                <span className="text-[10px] font-mono text-slate-500">Admissible Cost</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {activeRoute?.segments.map((seg, idx) => (
                  <div
                    key={seg.segment_id + idx}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="truncate max-w-[180px]">{seg.road_name}</span>
                      <span className="text-[11px] text-indigo-400 font-mono">{seg.distance_meters}m</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{seg.start_node} → {seg.end_node}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        seg.congestion_level === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                        seg.congestion_level === 'moderate' ? 'bg-amber-500/20 text-amber-300' :
                        seg.congestion_level === 'heavy' ? 'bg-orange-500/20 text-orange-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {seg.congestion_level}
                      </span>
                    </div>
                    {seg.is_affected_by_incident && (
                      <p className="text-[10px] text-rose-400 font-semibold pt-0.5">
                        Alert: {seg.incident_notice}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
