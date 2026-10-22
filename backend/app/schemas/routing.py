from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RouteRequest(BaseModel):
    origin_id: Optional[str] = None
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    origin_name: Optional[str] = "Origin"

    destination_id: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    destination_name: Optional[str] = "Destination"

    objective: str = Field(
        default="congestion_aware",
        description="Routing objective: shortest_distance, fastest_time, congestion_aware, emergency_priority"
    )
    user_role: str = "commuter"
    departure_time: Optional[str] = None

class RouteSegmentStep(BaseModel):
    segment_id: str
    road_name: str
    start_node: str
    end_node: str
    distance_meters: float
    estimated_speed_kmh: float
    travel_time_seconds: float
    congestion_level: str
    geometry: List[List[float]]  # [[lat, lon], ...]
    is_affected_by_incident: bool = False
    incident_notice: Optional[str] = None

class RouteResult(BaseModel):
    route_id: str
    objective: str
    objective_label: str
    total_distance_km: float
    estimated_travel_time_minutes: float
    baseline_travel_time_minutes: float
    estimated_time_savings_pct: float
    congestion_exposure_pct: float
    node_sequence: List[str]
    ordered_coordinates: List[List[float]]  # [[lat, lon], ...]
    segments: List[RouteSegmentStep]
    incidents_encountered: int
    restrictions_encountered: int
    computation_latency_ms: float
    confidence_score: float
    recommendation_reason: str
    data_freshness_status: str
    is_emergency: bool = False

class RouteCompareResponse(BaseModel):
    origin: Dict[str, Any]
    destination: Dict[str, Any]
    routes: List[RouteResult]
    recommended_route_id: str
    active_incidents_in_area: int
    summary_explanation: str
