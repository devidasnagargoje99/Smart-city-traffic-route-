import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrafficSignal, UserRole } from '../types';
import { Sliders, Activity, Zap, Play, CheckCircle2, Clock } from 'lucide-react';

interface SignalManagementPageProps {
  currentRole: UserRole;
}

export const SignalManagementPage: React.FC<SignalManagementPageProps> = ({ currentRole }) => {
  const [signals, setSignals] = useState<TrafficSignal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string>('sig_shivaji_chowk');
  const [demandVph, setDemandVph] = useState<number>(1650);
  const [greenSplit, setGreenSplit] = useState<number>(55);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const data = await api.getSignals();
        setSignals(data);
      } catch (err) {
        console.error("Failed to load signals:", err);
      }
    };
    fetchSignals();
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulateSignal(selectedSignalId, demandVph, greenSplit);
      setSimulationResult(res);
    } catch (err) {
      console.error("Signal simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Smart Traffic Signal Management & Adaptive Timing
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate actuated and adaptive Webster timing plans across major Hinjawadi junctions.
        </p>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map(sig => {
          const isSelected = sig.id === selectedSignalId;
          return (
            <div
              key={sig.id}
              onClick={() => setSelectedSignalId(sig.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    {sig.control_mode.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono text-emerald-400">Online</span>
                  </div>
                </div>
                <h4 className="font-bold text-sm text-white">{sig.name}</h4>
                <p className="text-xs text-slate-400">{sig.current_phase}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-700/50">
                <div className="p-1.5 rounded-lg bg-slate-900/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Cycle</span>
                  <span className="font-bold text-slate-200">{sig.cycle_length_sec}s</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Green</span>
                  <span className="font-bold text-emerald-400">{sig.green_time_sec}s</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/60">
                  <span className="text-[10px] text-slate-500 block uppercase">Delay</span>
                  <span className="font-bold text-amber-400">{sig.avg_delay_sec}s</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adaptive Timing Simulator Playground */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base text-white">Adaptive Webster Timing Experiment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Target Intersection Signal
              </label>
              <select
                value={selectedSignalId}
                onChange={e => setSelectedSignalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100"
              >
                {signals.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Peak Influx Demand:</span>
                <span className="font-mono text-indigo-400">{demandVph} vehicles / hour</span>
              </div>
              <input
                type="range"
                min="800"
                max="2400"
                step="50"
                value={demandVph}
                onChange={e => setDemandVph(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Proposed Green Phase Split:</span>
                <span className="font-mono text-indigo-400">{greenSplit}%</span>
              </div>
              <input
                type="range"
                min="35"
                max="75"
                step="5"
                value={greenSplit}
                onChange={e => setGreenSplit(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Evaluating...' : 'Simulate Webster Timing Plan'}</span>
            </button>
          </div>

          {/* Results Display */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3 text-xs">
            {simulationResult ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-bold text-indigo-300">{simulationResult.signal_name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    -{simulationResult.delay_reduction_pct}% Delay Reduction
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Baseline Delay</span>
                    <span className="text-xl font-extrabold text-amber-400">
                      {simulationResult.baseline_delay_sec}s
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase block">Adaptive Delay</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      {simulationResult.optimized_delay_sec}s
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed italic text-[11px]">
                  {simulationResult.recommendation}
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select an intersection and run the adaptive simulator to calculate delay reductions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
