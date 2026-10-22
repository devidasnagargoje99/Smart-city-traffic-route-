from pydantic import BaseModel
from typing import List, Optional

class SimulationScenario(BaseModel):
    id: str
    name: str
    description: str
    time_of_day: str  # e.g., "09:00", "13:30", "18:45"
    rush_hour_factor: float
    rain_factor: float
    active_bottlenecks: List[str]

class ScenarioUpdateRequest(BaseModel):
    scenario_id: str
