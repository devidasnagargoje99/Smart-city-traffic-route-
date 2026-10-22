import enum
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, Enum
from datetime import datetime, timezone
from backend.app.core.database import Base

class IncidentType(str, enum.Enum):
    ACCIDENT = "accident"
    ROAD_CLOSURE = "road_closure"
    CONSTRUCTION = "construction"
    FLOODING = "flooding"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"
    PUBLIC_EVENT = "public_event"
    SIGNAL_FAILURE = "signal_failure"

class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, enum.Enum):
    REPORTED = "reported"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    RESOLVED = "resolved"

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(100), primary_key=True)  # e.g., "inc_2026_001"
    incident_type = Column(Enum(IncidentType), default=IncidentType.ACCIDENT, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_segment_id = Column(String(100), nullable=True)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.REPORTED, nullable=False)
    verified = Column(Boolean, default=False)
    delay_penalty_sec = Column(Float, default=300.0)  # Estimated delay added to affected segment
    blocks_road = Column(Boolean, default=False)       # If true, blocks passage completely
    reported_by = Column(String(100), default="operator")
    data_source = Column(String(50), default="simulation")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
