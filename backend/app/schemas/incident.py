from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from backend.app.models.incident import IncidentType, IncidentSeverity, IncidentStatus

class IncidentCreate(BaseModel):
    incident_type: IncidentType = IncidentType.ACCIDENT
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    latitude: float
    longitude: float
    road_segment_id: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    delay_penalty_sec: float = 300.0
    blocks_road: bool = False
    reported_by: str = "operator"

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    verified: Optional[bool] = None
    delay_penalty_sec: Optional[float] = None
    blocks_road: Optional[bool] = None

class IncidentResponse(BaseModel):
    id: str
    incident_type: IncidentType
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    road_segment_id: Optional[str] = None
    severity: IncidentSeverity
    status: IncidentStatus
    verified: bool
    delay_penalty_sec: float
    blocks_road: bool
    reported_by: str
    data_source: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
