from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum
import enum
from datetime import datetime, timezone
from backend.app.core.database import Base

class CongestionLevel(str, enum.Enum):
    LOW = "low"            # Green: > 75% free flow
    MODERATE = "moderate"  # Yellow: 50% - 75% free flow
    HEAVY = "heavy"        # Orange: 25% - 50% free flow
    SEVERE = "severe"      # Red: < 25% free flow
    UNKNOWN = "unknown"    # Gray: No data or stale

class TrafficObservation(Base):
    __tablename__ = "traffic_observations"

    id = Column(Integer, primary_key=True, index=True)
    road_segment_id = Column(String(100), ForeignKey("road_segments.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    observed_speed_kmh = Column(Float, nullable=False)
    expected_travel_time_sec = Column(Float, nullable=False)
    vehicle_count = Column(Integer, nullable=True)
    congestion_level = Column(Enum(CongestionLevel), default=CongestionLevel.LOW, nullable=False)
    data_source = Column(String(50), default="simulation")  # simulation, sensor_iot, gps_probe, manual_operator
    confidence_score = Column(Float, default=0.95)
    is_simulated = Column(Integer, default=1)  # 1 for simulated, 0 for verified live
