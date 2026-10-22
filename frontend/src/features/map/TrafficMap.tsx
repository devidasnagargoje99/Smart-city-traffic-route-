import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { RoadNode, RoadSegment, Incident, RouteResult, TrafficSignal } from '../../types';
import { AlertTriangle, Clock, Gauge, MapPin, Navigation, Radio } from 'lucide-react';

// Fix Leaflet default icon issues in bundler
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const originIcon = L.divIcon({
  className: 'custom-origin-pin',
  html: `<div style="background-color: #10b981; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: white; font-weight: bold; font-size: 12px;">A</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const destIcon = L.divIcon({
  className: 'custom-dest-pin',
  html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); color: white; font-weight: bold; font-size: 12px;">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

interface TrafficMapProps {
  nodes: RoadNode[];
  roads: RoadSegment[];
  incidents: Incident[];
  signals?: TrafficSignal[];
  activeRoute?: RouteResult | null;
  originCoords?: [number, number] | null;
  destCoords?: [number, number] | null;
  onMapClick?: (coords: [number, number]) => void;
  showCongestion?: boolean;
  showIncidents?: boolean;
  showSignals?: boolean;
}

// Controller to auto-fit bounds when route changes
function RouteBoundsController({ coords }: { coords?: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coords, map]);
  return null;
}

// Handler for user clicking on map
function MapClickHandler({ onClick }: { onClick?: (coords: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export const TrafficMap: React.FC<TrafficMapProps> = ({
  nodes,
  roads,
  incidents,
  signals = [],
  activeRoute,
  originCoords,
  destCoords,
  onMapClick,
  showCongestion = true,
  showIncidents = true,
  showSignals = true
}) => {
  // Hinjawadi Pune Center
  const defaultCenter: [number, number] = [18.5913, 73.7389];
  const [nodesMap, setNodesMap] = useState<Record<string, RoadNode>>({});

  useEffect(() => {
    const mapObj: Record<string, RoadNode> = {};
    nodes.forEach(n => {
      mapObj[n.id] = n;
    });
    setNodesMap(mapObj);
  }, [nodes]);

  const getCongestionColor = (level: string, isClosed: boolean) => {
    if (isClosed) return '#64748b'; // Slate gray
    switch (level) {
      case 'low': return '#10b981';       // Emerald green
      case 'moderate': return '#f59e0b';  // Amber yellow
      case 'heavy': return '#f97316';     // Vibrant orange
      case 'severe': return '#ef4444';    // Red
      default: return '#94a3b8';
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter tiles with OpenStreetMap attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapClickHandler onClick={onMapClick} />
        {activeRoute && <RouteBoundsController coords={activeRoute.ordered_coordinates} />}

        {/* 1. Road Segments Polylines */}
        {showCongestion && roads.map(road => {
          const u = nodesMap[road.start_node_id];
          const v = nodesMap[road.end_node_id];
          if (!u || !v) return null;

          const polyCoords: [number, number][] = [
            [u.latitude, u.longitude],
            [v.latitude, v.longitude]
          ];
          const color = getCongestionColor(road.congestion_level, road.is_closed);
          const weight = road.is_closed ? 3 : (road.congestion_level === 'severe' ? 6 : 5);

          return (
            <Polyline
              key={road.id}
              positions={polyCoords}
              pathOptions={{
                color: color,
                weight: weight,
                opacity: road.is_closed ? 0.6 : 0.85,
                dashArray: road.is_closed ? '6, 8' : undefined
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{road.name}</p>
                  <p className="text-slate-600">Category: {road.road_category}</p>
                  <p className="text-slate-600">Speed Limit: {road.speed_limit_kmh} km/h</p>
                  <p className="font-semibold text-indigo-700">Current Speed: {road.current_speed_kmh} km/h</p>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="capitalize font-bold text-slate-800">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-white ${
                      road.is_closed ? 'bg-slate-700' :
                      road.congestion_level === 'low' ? 'bg-emerald-600' :
                      road.congestion_level === 'moderate' ? 'bg-amber-600' :
                      road.congestion_level === 'heavy' ? 'bg-orange-600' : 'bg-rose-600'
                    }`}>
                      {road.is_closed ? 'ROAD CLOSED' : `${road.congestion_level} congestion`}
                    </span>
                  </div>
                  {road.closure_reason && (
                    <p className="text-rose-600 font-semibold">{road.closure_reason}</p>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* 2. Calculated Active Route Overlay */}
        {activeRoute && (
          <>
            {/* Outer glowing path */}
            <Polyline
              positions={activeRoute.ordered_coordinates}
              pathOptions={{
                color: activeRoute.is_emergency ? '#ec4899' : '#3b82f6',
                weight: 10,
                opacity: 0.4
              }}
            />
            {/* Inner primary route line */}
            <Polyline
              positions={activeRoute.ordered_coordinates}
              pathOptions={{
                color: activeRoute.is_emergency ? '#f43f5e' : '#6366f1',
                weight: 5,
                opacity: 0.95
              }}
            />
          </>
        )}

        {/* 3. Road Junctions / Nodes Markers */}
        {nodes.map(n => (
          <CircleMarker
            key={n.id}
            center={[n.latitude, n.longitude]}
            radius={n.has_signal ? 6 : 4}
            pathOptions={{
              color: '#1e293b',
              fillColor: n.has_signal ? '#6366f1' : '#cbd5e1',
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold text-slate-900">{n.name}</p>
                <p className="text-slate-600">Type: {n.intersection_type}</p>
                {n.has_signal && <p className="text-indigo-600 font-medium">Smart Signal Controlled</p>}
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  [{n.latitude.toFixed(4)}, {n.longitude.toFixed(4)}]
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 4. Incident Markers */}
        {showIncidents && incidents.filter(inc => inc.status !== 'resolved').map(inc => (
          <CircleMarker
            key={inc.id}
            center={[inc.latitude, inc.longitude]}
            radius={inc.blocks_road ? 11 : 9}
            pathOptions={{
              color: '#ffffff',
              fillColor: inc.blocks_road ? '#b91c1c' : '#ea580c',
              fillOpacity: 0.95,
              weight: 2
            }}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{inc.title}</span>
                </div>
                <p className="text-slate-600">{inc.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                    Severity: {inc.severity}
                  </span>
                  <span className="text-slate-500 font-medium">+{Math.round(inc.delay_penalty_sec / 60)} min delay</span>
                </div>
                {inc.blocks_road && (
                  <p className="text-rose-700 font-bold uppercase text-[10px] tracking-wider">
                    Full Road Closure
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 5. Origin and Destination Pins */}
        {originCoords && (
          <Marker position={originCoords} icon={originIcon}>
            <Popup><div className="text-xs font-bold text-emerald-800">Trip Origin (A)</div></Popup>
          </Marker>
        )}
        {destCoords && (
          <Marker position={destCoords} icon={destIcon}>
            <Popup><div className="text-xs font-bold text-rose-800">Trip Destination (B)</div></Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur text-xs space-y-2 pointer-events-auto">
        <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Traffic Conditions</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Low Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-orange-500" />
            <span>Heavy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-rose-500" />
            <span>Severe</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="w-3.5 h-1.5 rounded-full bg-slate-500 border border-dashed border-white" />
            <span>Road Closure / Blockade</span>
          </div>
        </div>
      </div>

      {/* Hinjawadi Watermark Tag */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg shadow backdrop-blur text-[11px] text-slate-300 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
        <span>Hinjawadi IT Corridor, Pune (18.5913° N, 73.7389° E)</span>
      </div>
    </div>
  );
};
