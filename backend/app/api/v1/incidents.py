from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from backend.app.services.incident_service import incident_service
from backend.app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse
from backend.app.models.incident import IncidentStatus

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(status: Optional[IncidentStatus] = None):
    return incident_service.list_incidents(status=status)

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_by_id(incident_id: str):
    inc = incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("", response_model=IncidentResponse)
def create_incident(data: IncidentCreate):
    return incident_service.create_incident(data)

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(incident_id: str, updates: IncidentUpdate):
    inc = incident_service.update_incident(incident_id, updates)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
def resolve_incident(incident_id: str):
    inc = incident_service.resolve_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc
