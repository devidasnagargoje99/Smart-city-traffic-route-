from sqlalchemy import Column, String, Integer, DateTime, Text
from datetime import datetime, timezone
from backend.app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "incident_verified", "signal_phase_override", "scenario_switched"
    target_resource = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
