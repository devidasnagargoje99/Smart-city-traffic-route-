from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class NodeResponse(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    intersection_type: str
    has_signal: bool

    model_config = ConfigDict(from_attributes=True)

class SegmentResponse(BaseModel):
    id: str
    start_node_id: str
    end_node_id: str
    name: str
    road_category: str
    distance_meters: float
    speed_limit_kmh: float
    baseline_speed_kmh: float
    current_speed_kmh: float
    is_one_way: bool
    is_closed: bool
    closure_reason: Optional[str] = None
    lanes: int
    geometry_geojson: Optional[str] = None
    congestion_level: str = "low"
    speed_ratio: float = 1.0

    model_config = ConfigDict(from_attributes=True)

class NetworkSummary(BaseModel):
    total_nodes: int
    total_segments: int
    active_incidents: int
    congested_segments: int
    average_network_speed_kmh: float
    data_freshness_sec: int
    mode: str = "SIMULATION MODE"
    city: str
    area: str
