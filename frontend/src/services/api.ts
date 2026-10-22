import {
  NetworkSummary,
  RoadNode,
  RoadSegment,
  RouteResult,
  RouteCompareResponse,
  Incident,
  TrafficSignal,
  SimulationScenario,
  DashboardOverview
} from '../types';
import networkData from './networkData.json';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// In-memory fallback dataset for GitHub Pages / static deployment
let mockIncidents: Incident[] = [
  {
    id: "inc_hinj_001",
    incident_type: "accident",
    title: "Multi-Vehicle Collision near Shivaji Chowk Gateway",
    description: "Collision between a cab and a mini-bus on the Hinjawadi entry ramp. Blocking 1 lane.",
    latitude: 18.5915,
    longitude: 73.7385,
    road_segment_id: "seg_wakad_bridge_shivaji",
    severity: "high",
    status: "verified",
    verified: true,
    delay_penalty_sec: 480.0,
    blocks_road: false,
    reported_by: "Traffic Operator (Pune Police Control)",
    data_source: "simulation",
    created_at: new Date().toISOString()
  },
  {
    id: "inc_hinj_002",
    incident_type: "construction",
    title: "Smart City Metro Pillar Construction at Bhumkar Underpass",
    description: "Lane narrowing due to Pune Metro Line 3 girder erection.",
    latitude: 18.5985,
    longitude: 73.7542,
    road_segment_id: "seg_bhumkar_wakad_bridge",
    severity: "medium",
    status: "verified",
    verified: true,
    delay_penalty_sec: 300.0,
    blocks_road: false,
    reported_by: "PMRDA Infrastructure Cell",
    data_source: "simulation",
    created_at: new Date().toISOString()
  }
];

let mockCurrentScenario: SimulationScenario = {
  id: "morning_peak",
  name: "Morning Inbound IT Rush Hour (09:15)",
  description: "High influx of IT workforce from Pune city entering Hinjawadi Phase 1, 2, and 3.",
  time_of_day: "09:15",
  rush_hour_factor: 0.38,
  rain_factor: 1.0,
  active_bottlenecks: ["seg_wakad_bridge_shivaji", "seg_bhumkar_wakad_bridge"]
};

export const api = {
  // Map and Network
  getSummary: async (): Promise<NetworkSummary> => {
    try {
      return await fetchJson<NetworkSummary>(`${API_BASE}/map/summary`);
    } catch {
      return {
        total_nodes: networkData.nodes.length,
        total_segments: networkData.segments.length * 2,
        active_incidents: mockIncidents.filter(i => i.status !== 'resolved').length,
        congested_segments: 6,
        average_network_speed_kmh: 38.5,
        data_freshness_sec: 4,
        mode: "SIMULATION MODE (Hinjawadi Model)",
        city: "Pune, Maharashtra, India",
        area: "Hinjawadi IT Corridor"
      };
    }
  },

  getNodes: async (): Promise<RoadNode[]> => {
    try {
      return await fetchJson<RoadNode[]>(`${API_BASE}/map/nodes`);
    } catch {
      return networkData.nodes as RoadNode[];
    }
  },

  getRoads: async (): Promise<RoadSegment[]> => {
    try {
      return await fetchJson<RoadSegment[]>(`${API_BASE}/map/roads`);
    } catch {
      return networkData.segments.map((s: any) => ({
        ...s,
        current_speed_kmh: Math.round(s.baseline_speed_kmh * (mockCurrentScenario.rush_hour_factor || 0.8)),
        congestion_level: s.name.includes("Shivaji") ? "severe" : s.name.includes("Bhumkar") ? "heavy" : "moderate",
        speed_ratio: 0.65,
        is_closed: mockCurrentScenario.id === 'road_closure_incident' && s.id === 'seg_wakad_bridge_shivaji'
      })) as RoadSegment[];
    }
  },

  getPlaces: async () => {
    try {
      return await fetchJson<{ id: string; name: string; latitude: number; longitude: number; type: string }[]>(`${API_BASE}/routes/places`);
    } catch {
      return networkData.nodes.map(n => ({
        id: n.id,
        name: n.name,
        latitude: n.latitude,
        longitude: n.longitude,
        type: n.intersection_type
      }));
    }
  },

  // Routing
  optimizeRoute: async (payload: {
    origin_id?: string;
    origin_lat?: number;
    origin_lon?: number;
    origin_name?: string;
    destination_id?: string;
    destination_lat?: number;
    destination_lon?: number;
    destination_name?: string;
    objective?: string;
    user_role?: string;
  }): Promise<RouteResult> => {
    try {
      return await fetchJson<RouteResult>(`${API_BASE}/routes/optimize`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      const u = networkData.nodes.find(n => n.id === payload.origin_id) || networkData.nodes[0];
      const v = networkData.nodes.find(n => n.id === payload.destination_id) || networkData.nodes[10];
      const coords: [number, number][] = [
        [u.latitude, u.longitude],
        [18.594, 73.734],
        [18.5885, 73.725],
        [18.5833, 73.7082],
        [v.latitude, v.longitude]
      ];
      return {
        route_id: `rt_client_${Date.now()}`,
        objective: payload.objective || "congestion_aware",
        objective_label: payload.objective === 'emergency_priority' ? "108 Emergency Priority Corridor" : "Congestion-Optimized Route",
        total_distance_km: 8.9,
        estimated_travel_time_minutes: payload.objective === 'emergency_priority' ? 14.5 : 24.2,
        baseline_travel_time_minutes: 34.0,
        estimated_time_savings_pct: 28.8,
        congestion_exposure_pct: 18.0,
        node_sequence: [u.id, "blue_ridge_chowk", "hinjawadi_ph1_circle", "wipro_circle_ph2", v.id],
        ordered_coordinates: coords,
        segments: [],
        incidents_encountered: 1,
        restrictions_encountered: 0,
        computation_latency_ms: 4.2,
        confidence_score: 0.95,
        recommendation_reason: "Optimally balances travel duration and bypasses severe chokepoints in Hinjawadi IT Park.",
        data_freshness_status: "Real-Time Simulated (Hinjawadi Model)",
        is_emergency: payload.objective === 'emergency_priority'
      };
    }
  },

  compareRoutes: async (payload: {
    origin_id?: string;
    origin_lat?: number;
    origin_lon?: number;
    destination_id?: string;
    destination_lat?: number;
    destination_lon?: number;
    user_role?: string;
  }): Promise<RouteCompareResponse> => {
    try {
      return await fetchJson<RouteCompareResponse>(`${API_BASE}/routes/compare`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      const u = networkData.nodes.find(n => n.id === payload.origin_id) || networkData.nodes[0];
      const v = networkData.nodes.find(n => n.id === payload.destination_id) || networkData.nodes[10];

      const r1 = await api.optimizeRoute({ ...payload, objective: "congestion_aware" });
      const r2 = await api.optimizeRoute({ ...payload, objective: "fastest_time" });
      r2.objective_label = "Fastest Route";
      r2.estimated_travel_time_minutes = 22.0;

      const r3 = await api.optimizeRoute({ ...payload, objective: "shortest_distance" });
      r3.objective_label = "Shortest Distance";
      r3.total_distance_km = 8.1;
      r3.estimated_travel_time_minutes = 39.5;
      r3.recommendation_reason = "Shortest physical route but encounters heavy bottleneck at Shivaji Chowk.";

      return {
        origin: { node_id: u.id, name: u.name, latitude: u.latitude, longitude: u.longitude },
        destination: { node_id: v.id, name: v.name, latitude: v.latitude, longitude: v.longitude },
        routes: [r1, r2, r3],
        recommended_route_id: r1.route_id,
        active_incidents_in_area: 2,
        summary_explanation: `Evaluated 3 viable routes connecting ${u.name} to ${v.name}. Recommended route is Congestion-Optimized with 24.2 min estimated time.`
      };
    }
  },

  // Incidents
  getIncidents: async (status?: string): Promise<Incident[]> => {
    try {
      return await fetchJson<Incident[]>(`${API_BASE}/incidents${status ? `?status=${status}` : ''}`);
    } catch {
      if (status && status !== 'all') {
        return mockIncidents.filter(i => i.status === status);
      }
      return mockIncidents;
    }
  },

  createIncident: async (payload: Partial<Incident>): Promise<Incident> => {
    try {
      return await fetchJson<Incident>(`${API_BASE}/incidents`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      const newInc: Incident = {
        id: `inc_client_${Date.now()}`,
        incident_type: payload.incident_type || "accident",
        title: payload.title || "Reported Incident",
        description: payload.description,
        latitude: payload.latitude || 18.5912,
        longitude: payload.longitude || 73.7389,
        severity: payload.severity || "medium",
        status: "reported",
        verified: false,
        delay_penalty_sec: payload.delay_penalty_sec || 300,
        blocks_road: payload.blocks_road || false,
        reported_by: payload.reported_by || "Operator",
        data_source: "simulation",
        created_at: new Date().toISOString()
      };
      mockIncidents.unshift(newInc);
      return newInc;
    }
  },

  updateIncident: async (id: string, updates: Partial<Incident>): Promise<Incident> => {
    try {
      return await fetchJson<Incident>(`${API_BASE}/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch {
      const idx = mockIncidents.findIndex(i => i.id === id);
      if (idx !== -1) {
        mockIncidents[idx] = { ...mockIncidents[idx], ...updates };
        return mockIncidents[idx];
      }
      throw new Error("Incident not found");
    }
  },

  resolveIncident: async (id: string): Promise<Incident> => {
    try {
      return await fetchJson<Incident>(`${API_BASE}/incidents/${id}/resolve`, {
        method: 'POST'
      });
    } catch {
      const idx = mockIncidents.findIndex(i => i.id === id);
      if (idx !== -1) {
        mockIncidents[idx].status = 'resolved';
        mockIncidents[idx].resolved_at = new Date().toISOString();
        return mockIncidents[idx];
      }
      throw new Error("Incident not found");
    }
  },

  // Smart Signals
  getSignals: async (): Promise<TrafficSignal[]> => {
    try {
      return await fetchJson<TrafficSignal[]>(`${API_BASE}/signals`);
    } catch {
      return [
        {
          id: "sig_shivaji_chowk",
          node_id: "shivaji_chowk",
          name: "Shivaji Chowk Smart Signal (Hinjawadi Gateway)",
          latitude: 18.5912,
          longitude: 73.7389,
          cycle_length_sec: 120,
          current_phase: "Phase 1: Inbound Green",
          green_time_sec: 50,
          red_time_sec: 65,
          yellow_time_sec: 5,
          estimated_queue_vehicles: 28,
          control_mode: "adaptive",
          avg_delay_sec: 42.5,
          optimized_delay_sec: 26.8
        },
        {
          id: "sig_bhumkar_chowk",
          node_id: "bhumkar_chowk",
          name: "Bhumkar Chowk Underpass Signal",
          latitude: 18.5982,
          longitude: 73.7548,
          cycle_length_sec: 110,
          current_phase: "Phase 2: NH48 Service Green",
          green_time_sec: 45,
          red_time_sec: 60,
          yellow_time_sec: 5,
          estimated_queue_vehicles: 22,
          control_mode: "adaptive",
          avg_delay_sec: 38.0,
          optimized_delay_sec: 24.5
        },
        {
          id: "sig_dange_chowk",
          node_id: "dange_chowk",
          name: "Dange Chowk Thergaon Signal",
          latitude: 18.6111,
          longitude: 73.7712,
          cycle_length_sec: 130,
          current_phase: "Phase 1: Thergaon-Tathawade Green",
          green_time_sec: 55,
          red_time_sec: 70,
          yellow_time_sec: 5,
          estimated_queue_vehicles: 35,
          control_mode: "actuated",
          avg_delay_sec: 48.2,
          optimized_delay_sec: 31.0
        }
      ];
    }
  },

  simulateSignal: async (signalId: string, demandVph: number, greenSplit: number) => {
    try {
      return await fetchJson<any>(`${API_BASE}/signals/simulate-adaptive`, {
        method: 'POST',
        body: JSON.stringify({
          signal_id: signalId,
          incoming_vehicle_demand_vph: demandVph,
          proposed_green_split: greenSplit
        })
      });
    } catch {
      const baselineDelay = 42.5;
      const optimizedDelay = Number((baselineDelay * (1.0 - (greenSplit / 100 - 0.40) * 0.75)).toFixed(1));
      const delayReduction = Number((((baselineDelay - optimizedDelay) / baselineDelay) * 100).toFixed(1));
      return {
        signal_id: signalId,
        signal_name: "Shivaji Chowk Smart Signal (Hinjawadi Gateway)",
        baseline_cycle_sec: 120,
        proposed_cycle_sec: 105,
        baseline_delay_sec: baselineDelay,
        optimized_delay_sec: optimizedDelay,
        delay_reduction_pct: delayReduction,
        estimated_queue_clearing_sec: 28.5,
        recommendation: `Adaptive algorithm recommends increasing green phase split to ${greenSplit}%. Expected to reduce intersection delay by ${delayReduction}%.`
      };
    }
  },

  // Simulation
  getScenarios: async (): Promise<SimulationScenario[]> => {
    try {
      return await fetchJson<SimulationScenario[]>(`${API_BASE}/simulation/scenarios`);
    } catch {
      return [
        {
          id: "off_peak",
          name: "Midday Off-Peak Flow (14:00)",
          description: "Moderate regular traffic across Hinjawadi IT Park corridors.",
          time_of_day: "14:00",
          rush_hour_factor: 0.9,
          rain_factor: 1.0,
          active_bottlenecks: []
        },
        {
          id: "morning_peak",
          name: "Morning Inbound IT Rush Hour (09:15)",
          description: "High influx of IT workforce from Pune city entering Hinjawadi Phase 1, 2, and 3.",
          time_of_day: "09:15",
          rush_hour_factor: 0.38,
          rain_factor: 1.0,
          active_bottlenecks: ["seg_wakad_bridge_shivaji", "seg_bhumkar_wakad_bridge"]
        },
        {
          id: "evening_peak",
          name: "Evening Outbound Exodus (18:45)",
          description: "Heavy outbound queue departing Megapolis Phase 3 towards NH48.",
          time_of_day: "18:45",
          rush_hour_factor: 0.35,
          rain_factor: 1.0,
          active_bottlenecks: ["seg_ph1_wipro_ph2", "seg_quadron_megapolis"]
        },
        {
          id: "monsoon_waterlogging",
          name: "Monsoon Downpour & Flooding (19:30)",
          description: "Heavy monsoon rains causing 40cm waterlogging at Bhumkar underpass.",
          time_of_day: "19:30",
          rush_hour_factor: 0.30,
          rain_factor: 0.55,
          active_bottlenecks: ["seg_bhumkar_wakad_bridge", "seg_bhumkar_suratwala"]
        },
        {
          id: "road_closure_incident",
          name: "Major Chokepoint Closure at Shivaji Gateway",
          description: "Tanker breakdown blocks Shivaji Flyover approach. Tests automatic bypass rerouting.",
          time_of_day: "10:00",
          rush_hour_factor: 0.45,
          rain_factor: 1.0,
          active_bottlenecks: ["seg_wakad_bridge_shivaji"]
        }
      ];
    }
  },

  getCurrentSimulation: async () => {
    try {
      return await fetchJson<any>(`${API_BASE}/simulation/current`);
    } catch {
      return {
        active_scenario: mockCurrentScenario,
        simulated_clock: mockCurrentScenario.time_of_day,
        is_simulation_mode: true,
        city: "Pune, Maharashtra, India",
        corridor: "Hinjawadi Rajiv Gandhi Infotech Park"
      };
    }
  },

  setScenario: async (scenarioId: string): Promise<SimulationScenario> => {
    try {
      return await fetchJson<SimulationScenario>(`${API_BASE}/simulation/scenario`, {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenarioId })
      });
    } catch {
      const scenarios = await api.getScenarios();
      const found = scenarios.find(s => s.id === scenarioId) || scenarios[0];
      mockCurrentScenario = found;
      return found;
    }
  },

  // Analytics
  getAnalyticsOverview: async (): Promise<DashboardOverview> => {
    try {
      return await fetchJson<DashboardOverview>(`${API_BASE}/analytics/overview`);
    } catch {
      return {
        total_monitored_segments: 27,
        current_congested_segments: 4,
        active_incidents: mockIncidents.filter(i => i.status !== 'resolved').length,
        average_travel_time_min: 24.5,
        estimated_network_delay_sec: 720,
        traffic_data_freshness_sec: 3,
        route_optimization_requests_24h: 1480,
        system_status: "OPTIMAL - All Systems Operational",
        simulation_mode: true,
        city: "Pune, Maharashtra, India",
        area: "Hinjawadi IT Corridor"
      };
    }
  },

  getCongestionData: async () => {
    try {
      return await fetchJson<any[]>(`${API_BASE}/analytics/congestion`);
    } catch {
      return [
        { category: "Expressway", road_count: 6, avg_speed_kmh: 68.5, congestion_ratio: 0.85 },
        { category: "Arterial", road_count: 12, avg_speed_kmh: 32.0, congestion_ratio: 0.52 },
        { category: "Sub Arterial", road_count: 8, avg_speed_kmh: 28.5, congestion_ratio: 0.48 },
        { category: "Local", road_count: 4, avg_speed_kmh: 22.0, congestion_ratio: 0.42 }
      ];
    }
  },

  getTravelTimeTrends: async () => {
    try {
      return await fetchJson<any[]>(`${API_BASE}/analytics/travel-times`);
    } catch {
      return [
        { hour: "06:00", observed_time_min: 13.5, optimized_time_min: 12.0, congestion_index: 0.2 },
        { hour: "07:00", observed_time_min: 18.0, optimized_time_min: 14.5, congestion_index: 0.4 },
        { hour: "08:00", observed_time_min: 28.5, optimized_time_min: 19.2, congestion_index: 0.75 },
        { hour: "09:00", observed_time_min: 42.0, optimized_time_min: 24.5, congestion_index: 0.95 },
        { hour: "10:00", observed_time_min: 38.0, optimized_time_min: 22.0, congestion_index: 0.88 },
        { hour: "11:00", observed_time_min: 24.0, optimized_time_min: 17.5, congestion_index: 0.55 },
        { hour: "14:00", observed_time_min: 18.0, optimized_time_min: 14.2, congestion_index: 0.30 },
        { hour: "17:00", observed_time_min: 34.0, optimized_time_min: 21.5, congestion_index: 0.78 },
        { hour: "18:00", observed_time_min: 46.5, optimized_time_min: 26.0, congestion_index: 0.98 },
        { hour: "19:00", observed_time_min: 44.0, optimized_time_min: 25.5, congestion_index: 0.92 },
        { hour: "21:00", observed_time_min: 22.0, optimized_time_min: 16.0, congestion_index: 0.45 }
      ];
    }
  },

  getAiModelReport: async () => {
    try {
      return await fetchJson<any>(`${API_BASE}/analytics/prediction-model`);
    } catch {
      return {
        is_trained: true,
        trained_at: new Date().toISOString(),
        baseline_model: {
          model_type: "Historical Hour-Category Average Baseline",
          test_sample_count: 576,
          mae_seconds: 24.8,
          rmse_seconds: 31.2
        },
        ml_model: {
          model_type: "Scikit-Learn Ridge Traffic Predictor",
          features_used: ["hour", "day_of_week", "is_weekend", "category_code", "distance_m", "prev_hour_speed"],
          training_samples: 1584,
          test_samples: 576,
          mae_seconds: 18.2,
          rmse_seconds: 23.5,
          mae_improvement_pct: 26.6,
          training_time: new Date().toISOString()
        },
        area: "Hinjawadi IT Park, Pune"
      };
    }
  },

  getOptimizationPerformance: async () => {
    try {
      return await fetchJson<any>(`${API_BASE}/analytics/optimization-performance`);
    } catch {
      return {
        total_queries: 1480,
        avg_time_savings_pct: 28.4,
        total_hours_saved: 624.5,
        co2_reduction_kg: 1498.0
      };
    }
  }
};
