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

export const api = {
  // Map and Network
  getSummary: () => fetchJson<NetworkSummary>(`${API_BASE}/map/summary`),
  getNodes: () => fetchJson<RoadNode[]>(`${API_BASE}/map/nodes`),
  getRoads: () => fetchJson<RoadSegment[]>(`${API_BASE}/map/roads`),
  getPlaces: () => fetchJson<{ id: string; name: string; latitude: number; longitude: number; type: string }[]>(`${API_BASE}/routes/places`),

  // Routing
  optimizeRoute: (payload: {
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
  }) => fetchJson<RouteResult>(`${API_BASE}/routes/optimize`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  compareRoutes: (payload: {
    origin_id?: string;
    origin_lat?: number;
    origin_lon?: number;
    destination_id?: string;
    destination_lat?: number;
    destination_lon?: number;
    user_role?: string;
  }) => fetchJson<RouteCompareResponse>(`${API_BASE}/routes/compare`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Incidents
  getIncidents: (status?: string) => fetchJson<Incident[]>(`${API_BASE}/incidents${status ? `?status=${status}` : ''}`),
  createIncident: (payload: Partial<Incident>) => fetchJson<Incident>(`${API_BASE}/incidents`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateIncident: (id: string, updates: Partial<Incident>) => fetchJson<Incident>(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  resolveIncident: (id: string) => fetchJson<Incident>(`${API_BASE}/incidents/${id}/resolve`, {
    method: 'POST'
  }),

  // Smart Signals
  getSignals: () => fetchJson<TrafficSignal[]>(`${API_BASE}/signals`),
  simulateSignal: (signalId: string, demandVph: number, greenSplit: number) => fetchJson<any>(`${API_BASE}/signals/simulate-adaptive`, {
    method: 'POST',
    body: JSON.stringify({
      signal_id: signalId,
      incoming_vehicle_demand_vph: demandVph,
      proposed_green_split: greenSplit
    })
  }),

  // Simulation
  getScenarios: () => fetchJson<SimulationScenario[]>(`${API_BASE}/simulation/scenarios`),
  getCurrentSimulation: () => fetchJson<{
    active_scenario: SimulationScenario;
    simulated_clock: string;
    is_simulation_mode: boolean;
    city: string;
    corridor: string;
  }>(`${API_BASE}/simulation/current`),
  setScenario: (scenarioId: string) => fetchJson<SimulationScenario>(`${API_BASE}/simulation/scenario`, {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId })
  }),

  // Analytics
  getAnalyticsOverview: () => fetchJson<DashboardOverview>(`${API_BASE}/analytics/overview`),
  getCongestionData: () => fetchJson<{ category: string; road_count: number; avg_speed_kmh: number; congestion_ratio: number }[]>(`${API_BASE}/analytics/congestion`),
  getTravelTimeTrends: () => fetchJson<{ hour: string; observed_time_min: number; optimized_time_min: number; congestion_index: number }[]>(`${API_BASE}/analytics/travel-times`),
  getAiModelReport: () => fetchJson<any>(`${API_BASE}/analytics/prediction-model`),
  getOptimizationPerformance: () => fetchJson<any>(`${API_BASE}/analytics/optimization-performance`)
};
