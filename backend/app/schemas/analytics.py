from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardOverview(BaseModel):
    total_monitored_segments: int
    current_congested_segments: int
    active_incidents: int
    average_travel_time_min: float
    estimated_network_delay_sec: float
    traffic_data_freshness_sec: int
    route_optimization_requests_24h: int
    system_status: str
    simulation_mode: bool
    city: str
    area: str

class CongestionCategoryData(BaseModel):
    category: str
    road_count: int
    avg_speed_kmh: float
    congestion_ratio: float

class TravelTimeTrendPoint(BaseModel):
    hour: str
    observed_time_min: float
    optimized_time_min: float
    congestion_index: float

class OptimizationSavings(BaseModel):
    total_queries: int
    avg_time_savings_pct: float
    total_hours_saved: float
    co2_reduction_kg: float
