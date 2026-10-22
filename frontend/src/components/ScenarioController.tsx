import React from 'react';
import { Play, CloudRain, AlertOctagon, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { SimulationScenario } from '../types';

interface ScenarioControllerProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  isLoading?: boolean;
}

export const ScenarioController: React.FC<ScenarioControllerProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  isLoading
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'morning_peak':
        return <Play className="w-3.5 h-3.5 text-indigo-400" />;
      case 'evening_peak':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'monsoon_waterlogging':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" />;
      case 'road_closure_incident':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Simulation Scenario Engine
          </span>
          <span className="text-[11px] text-slate-400">
            Reproducible Hinjawadi traffic dynamics & chokepoint tests
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
        {scenarios.map(sc => {
          const isActive = sc.id === activeScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
              title={sc.description}
            >
              {getIcon(sc.id)}
              <span>{sc.name.split('(')[0].trim()}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-700 text-slate-400'}`}>
                {sc.time_of_day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
