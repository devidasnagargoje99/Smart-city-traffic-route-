import React from 'react';
import { Settings, Shield, MapPin, Globe, Database, Terminal, Cpu } from 'lucide-react';
import { UserRole } from '../types';

interface SettingsPageProps {
  currentRole: UserRole;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentRole }) => {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          System Settings & Platform Governance
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Geographic focus, GIS licensing attribution, role authorizations, and API documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geographic Focus */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Geographic Configuration</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Target Metropolitan Area:</span>
              <span className="font-semibold text-slate-100">Pune, Maharashtra, India</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Primary Corridor:</span>
              <span className="font-semibold text-slate-100">Rajiv Gandhi Infotech Park, Hinjawadi</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Default Coordinates:</span>
              <span className="font-mono text-indigo-400">18.5913° N, 73.7389° E</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Timezone:</span>
              <span className="font-semibold text-slate-100">Asia/Kolkata (IST +05:30)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Distance & Speed Units:</span>
              <span className="font-semibold text-slate-100">Kilometers (km), km/h</span>
            </div>
          </div>
        </div>

        {/* Role Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Role-Based Access Control</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-800/60 flex items-center justify-between">
              <div>
                <strong className="text-purple-300 block">Administrator (PMRDA)</strong>
                <span className="text-[11px] text-slate-400">User management, system configurations, audit logs</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">Full Access</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 flex items-center justify-between">
              <div>
                <strong className="text-blue-300 block">Traffic Operator (Police)</strong>
                <span className="text-[11px] text-slate-400">Incident verification, road closures, signal timings</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-400">Operational</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 flex items-center justify-between">
              <div>
                <strong className="text-rose-300 block">108 Emergency Response</strong>
                <span className="text-[11px] text-slate-400">Priority corridor solving, hospital dispatch routes</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-rose-400">Priority Corridor</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 flex items-center justify-between">
              <div>
                <strong className="text-emerald-300 block">Commuter</strong>
                <span className="text-[11px] text-slate-400">Origin-destination routing, alternatives comparison</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Standard</span>
            </div>
          </div>
        </div>

        {/* GIS & Attribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-white">GIS & Map Tile Attribution</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              • Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-indigo-400 underline">OpenStreetMap</a> contributors under ODbL license.
            </p>
            <p>
              • Base map tiles courtesy of <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" className="text-indigo-400 underline">CARTO</a> Voyager Dark / Light vector raster services.
            </p>
            <p className="text-slate-400 text-[11px]">
              Coordinate reference system: EPSG:4326 (WGS 84). All distances computed using Haversine spherical trigonometric formulation.
            </p>
          </div>
        </div>

        {/* Backend Infrastructure */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">API & Runtime Specs</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">FastAPI Interactive Docs:</span>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="font-mono text-indigo-400 underline">/docs (Swagger UI)</a>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Alternative Redoc:</span>
              <a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer" className="font-mono text-indigo-400 underline">/redoc</a>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">WebSocket Live Channel:</span>
              <span className="font-mono text-slate-200">/ws/traffic</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800/60">
              <span className="text-slate-400">Simulation Status:</span>
              <span className="font-semibold text-emerald-400">Deterministic Hinjawadi Model Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
