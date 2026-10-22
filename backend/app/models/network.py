from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.core.database import Base

class RoadNode(Base):
    __tablename__ = "road_nodes"

    id = Column(String(100), primary_key=True)  # e.g., "shivaji_chowk"
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    intersection_type = Column(String(50), default="roundabout")  # signalized, roundabout, un-signalized, freeway_ramp
    has_signal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(100), primary_key=True)  # e.g., "seg_shivaji_ph1"
    start_node_id = Column(String(100), ForeignKey("road_nodes.id"), nullable=False)
    end_node_id = Column(String(100), ForeignKey("road_nodes.id"), nullable=False)
    name = Column(String(255), nullable=False)
    road_category = Column(String(50), default="arterial")  # expressway, arterial, sub_arterial, local
    distance_meters = Column(Float, nullable=False)
    speed_limit_kmh = Column(Float, default=50.0)
    baseline_speed_kmh = Column(Float, default=45.0)
    current_speed_kmh = Column(Float, default=45.0)
    is_one_way = Column(Boolean, default=False)
    is_closed = Column(Boolean, default=False)
    closure_reason = Column(String(255), nullable=True)
    lanes = Column(Integer, default=2)
    geometry_geojson = Column(Text, nullable=True)  # JSON string of [[lat, lon], ...]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
