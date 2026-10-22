from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class SignalResponse(BaseModel):
    id: str
    node_id: str
    name: str
    latitude: float
    longitude: float
    cycle_length_sec: int
    current_phase: str
    green_time_sec: int
    red_time_sec: int
    yellow_time_sec: int
    estimated_queue_vehicles: int
    control_mode: str
    avg_delay_sec: float
    optimized_delay_sec: float

    model_config = ConfigDict(from_attributes=True)

class SignalSimulationRequest(BaseModel):
    signal_id: str
    incoming_vehicle_demand_vph: int = 1400  # vehicles per hour
    proposed_green_split: int = 55           # proposed green split percentage

class SignalSimulationResult(BaseModel):
    signal_id: str
    signal_name: str
    baseline_cycle_sec: int
    proposed_cycle_sec: int
    baseline_delay_sec: float
    optimized_delay_sec: float
    delay_reduction_pct: float
    estimated_queue_clearing_sec: float
    recommendation: str
