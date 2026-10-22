from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"

    id = Column(String(100), primary_key=True)  # e.g., "sig_shivaji_chowk"
    node_id = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    cycle_length_sec = Column(Integer, default=120)
    current_phase = Column(String(50), default="North-South Green")
    green_time_sec = Column(Integer, default=45)
    red_time_sec = Column(Integer, default=70)
    yellow_time_sec = Column(Integer, default=5)
    estimated_queue_vehicles = Column(Integer, default=15)
    control_mode = Column(String(50), default="adaptive")  # fixed, actuated, adaptive
    avg_delay_sec = Column(Float, default=32.5)
    optimized_delay_sec = Column(Float, default=21.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
