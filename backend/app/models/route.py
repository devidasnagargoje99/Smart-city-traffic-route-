from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from datetime import datetime, timezone
from backend.app.core.database import Base

class RouteCalculationLog(Base):
    __tablename__ = "route_calculation_logs"

    id = Column(Integer, primary_key=True, index=True)
    origin_name = Column(String(255), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_name = Column(String(255), nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    objective = Column(String(50), default="congestion_aware")  # shortest_distance, fastest_time, congestion_aware, emergency_priority
    user_role = Column(String(50), default="commuter")
    
    distance_km = Column(Float, nullable=False)
    travel_time_min = Column(Float, nullable=False)
    baseline_time_min = Column(Float, nullable=True)
    time_savings_pct = Column(Float, nullable=True)
    congestion_exposure_pct = Column(Float, default=0.0)
    computation_latency_ms = Column(Float, default=0.0)
    incident_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
