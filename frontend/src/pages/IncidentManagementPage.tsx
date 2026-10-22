import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Incident, IncidentType, IncidentSeverity, IncidentStatus, RoadNode, UserRole } from '../types';
import { TrafficCone, AlertTriangle, CheckCircle, ShieldAlert, Plus, X, RefreshCw } from 'lucide-react';

interface IncidentManagementPageProps {
  currentRole: UserRole;
}

export const IncidentManagementPage: React.FC<IncidentManagementPageProps> = ({ currentRole }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [nodes, setNodes] = useState<RoadNode[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('accident');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [selectedNodeId, setSelectedNodeId] = useState('shivaji_chowk');
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [blocksRoad, setBlocksRoad] = useState(false);

  const fetchIncidents = async () => {
    try {
      const [data, n] = await Promise.all([
        api.getIncidents(filterStatus === 'all' ? undefined : filterStatus),
        api.getNodes()
      ]);
      setIncidents(data);
      setNodes(n);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node || !title) return;

    setLoading(true);
    try {
      await api.createIncident({
        title,
        description,
        incident_type: incidentType,
        severity,
        latitude: node.latitude,
        longitude: node.longitude,
        delay_penalty_sec: delayMinutes * 60,
        blocks_road: blocksRoad,
        reported_by: `${currentRole.toUpperCase()} Console User`
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      await fetchIncidents();
    } catch (err) {
      console.error("Failed to report incident:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.updateIncident(id, { verified: true, status: 'verified' });
      await fetchIncidents();
    } catch (err) {
      console.error("Verify failed:", err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveIncident(id);
      await fetchIncidents();
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrafficCone className="w-6 h-6 text-amber-400" />
            Hinjawadi Incident & Road Closure Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative lifecycle control: Reported → Under Review → Verified → Resolved. Verified restrictions directly adapt the road routing graph.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Incident</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['all', 'reported', 'verified', 'resolved'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filterStatus === status
                ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map(inc => (
          <div
            key={inc.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inc.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  inc.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {inc.severity} Severity
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  inc.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                  inc.status === 'verified' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-300'
                }`}>
                  {inc.status}
                </span>
              </div>

              <h4 className="font-bold text-sm text-white">{inc.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{inc.description}</p>

              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span>Added Delay: <strong className="text-slate-200">+{Math.round(inc.delay_penalty_sec / 60)} min</strong></span>
                {inc.blocks_road && (
                  <span className="text-rose-400 font-bold uppercase tracking-wide">• Full Road Blockade</span>
                )}
                <span>Reported by: {inc.reported_by}</span>
              </div>
            </div>

            {/* Actions for operators/admins */}
            {inc.status !== 'resolved' && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                {!inc.verified && (
                  <button
                    onClick={() => handleVerify(inc.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition"
                  >
                    Verify & Apply Delay
                  </button>
                )}
                <button
                  onClick={() => handleResolve(inc.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Report Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Report Traffic Incident / Chokepoint
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanker breakdown near Shivaji Chowk"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Location / Junction
                </label>
                <select
                  value={selectedNodeId}
                  onChange={e => setSelectedNodeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Type
                  </label>
                  <select
                    value={incidentType}
                    onChange={e => setIncidentType(e.target.value as IncidentType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value="accident">Accident</option>
                    <option value="road_closure">Road Closure</option>
                    <option value="construction">Construction / Metro</option>
                    <option value="flooding">Flooding / Waterlogging</option>
                    <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Estimated Delay (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={delayMinutes}
                    onChange={e => setDelayMinutes(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="blocksRoad"
                    checked={blocksRoad}
                    onChange={e => setBlocksRoad(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="blocksRoad" className="text-slate-300 font-medium cursor-pointer">
                    Total Road Closure
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/20"
                >
                  {loading ? 'Submitting...' : 'Confirm & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
