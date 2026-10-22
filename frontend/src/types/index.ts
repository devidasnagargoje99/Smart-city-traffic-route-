export type UserRole = 'admin' | 'operator' | 'commuter' | 'emergency';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface RoadNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  intersection_type: string;
  has_signal: boolean;
}

export interface RoadSegment {
  id: string;
  start_node_id: string;
  end_node_id: string;
  name: string;
  road_category: string;
  distance_meters: number;
  speed_limit_kmh: number;
  baseline_speed_kmh: number;
  current_speed_kmh: number;
  is_one_way: boolean;
  is_closed: boolean;
  closure_reason?: string;
  lanes: number;
  congestion_level: 'low' | 'moderate' | 'heavy' | 'severe' | 'unknown';
  speed_ratio: number;
}

export interface NetworkSummary {
  total_nodes: number;
  total_segments: number;
  active_incidents: number;
  congested_segments: number;
  average_network_speed_kmh: number;
  data_freshness_sec: number;
  mode: string;
  city: string;
  area: string;
}

export interface RouteSegmentStep {
  segment_id: string;
  road_name: string;
  start_node: string;
  end_node: string;
  distance_meters: number;
  estimated_speed_kmh: number;
  travel_time_seconds: number;
  congestion_level: string;
  geometry: [number, number][];
  is_affected_by_incident: boolean;
  incident_notice?: string;
}

export interface RouteResult {
  route_id: string;
  objective: string;
  objective_label: string;
  total_distance_km: number;
  estimated_travel_time_minutes: number;
  baseline_travel_time_minutes: number;
  estimated_time_savings_pct: number;
  congestion_exposure_pct: number;
  node_sequence: string[];
  ordered_coordinates: [number, number][];
  segments: RouteSegmentStep[];
  incidents_encountered: number;
  restrictions_encountered: number;
  computation_latency_ms: number;
  confidence_score: number;
  recommendation_reason: string;
  data_freshness_status: string;
  is_emergency: boolean;
}

export interface RouteCompareResponse {
  origin: {
    node_id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    node_id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  routes: RouteResult[];
  recommended_route_id: string;
  active_incidents_in_area: number;
  summary_explanation: string;
}

export type IncidentType = 'accident' | 'road_closure' | 'construction' | 'flooding' | 'vehicle_breakdown' | 'public_event' | 'signal_failure';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'under_review' | 'verified' | 'resolved';

export interface Incident {
  id: string;
  incident_type: IncidentType;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  road_segment_id?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  verified: boolean;
  delay_penalty_sec: number;
  blocks_road: boolean;
  reported_by: string;
  data_source: string;
  created_at: string;
  resolved_at?: string;
}

export interface TrafficSignal {
  id: string;
  node_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cycle_length_sec: number;
  current_phase: string;
  green_time_sec: number;
  red_time_sec: number;
  yellow_time_sec: number;
  estimated_queue_vehicles: number;
  control_mode: string;
  avg_delay_sec: number;
  optimized_delay_sec: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  time_of_day: string;
  rush_hour_factor: number;
  rain_factor: number;
  active_bottlenecks: string[];
}

export interface DashboardOverview {
  total_monitored_segments: number;
  current_congested_segments: number;
  active_incidents: number;
  average_travel_time_min: number;
  estimated_network_delay_sec: number;
  traffic_data_freshness_sec: number;
  route_optimization_requests_24h: number;
  system_status: string;
  simulation_mode: boolean;
  city: string;
  area: string;
}
