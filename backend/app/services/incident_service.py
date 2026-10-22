import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict
from backend.app.models.incident import IncidentType, IncidentSeverity, IncidentStatus
from backend.app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse
from backend.app.services.graph_service import graph_service

class IncidentService:
    def __init__(self, service=graph_service):
        self.graph_service = service
        self.incidents: Dict[str, Dict] = {}
        self._seed_default_incidents()

    def _seed_default_incidents(self):
        """Seed realistic Hinjawadi demonstration incidents."""
        inc1_id = "inc_hinj_001"
        self.incidents[inc1_id] = {
            "id": inc1_id,
            "incident_type": IncidentType.ACCIDENT,
            "title": "Multi-Vehicle Collision near Shivaji Chowk Gateway",
            "description": "Collision between a cab and a mini-bus on the Hinjawadi entry ramp. Blocking 1 lane.",
            "latitude": 18.5915,
            "longitude": 73.7385,
            "road_segment_id": "seg_wakad_bridge_shivaji",
            "severity": IncidentSeverity.HIGH,
            "status": IncidentStatus.VERIFIED,
            "verified": True,
            "delay_penalty_sec": 480.0,
            "blocks_road": False,
            "reported_by": "Traffic Operator (Pune Police Control)",
            "data_source": "simulation",
            "created_at": datetime.now(timezone.utc),
            "resolved_at": None
        }
        self.graph_service.apply_incident(
            "seg_wakad_bridge_shivaji",
            delay_sec=480.0,
            blocks_road=False,
            incident_title="Multi-Vehicle Collision at Shivaji Chowk Gateway"
        )

        inc2_id = "inc_hinj_002"
        self.incidents[inc2_id] = {
            "id": inc2_id,
            "incident_type": IncidentType.CONSTRUCTION,
            "title": "Smart City Metro Pillar Construction at Bhumkar Underpass",
            "description": "Lane narrowing due to Pune Metro Line 3 girder erection.",
            "latitude": 18.5985,
            "longitude": 73.7542,
            "road_segment_id": "seg_bhumkar_wakad_bridge",
            "severity": IncidentSeverity.MEDIUM,
            "status": IncidentStatus.VERIFIED,
            "verified": True,
            "delay_penalty_sec": 300.0,
            "blocks_road": False,
            "reported_by": "PMRDA Infrastructure Cell",
            "data_source": "simulation",
            "created_at": datetime.now(timezone.utc),
            "resolved_at": None
        }
        self.graph_service.apply_incident(
            "seg_bhumkar_wakad_bridge",
            delay_sec=300.0,
            blocks_road=False,
            incident_title="Metro Pillar Construction at Bhumkar Underpass"
        )

    def list_incidents(self, status: Optional[IncidentStatus] = None) -> List[IncidentResponse]:
        results = []
        for inc in self.incidents.values():
            if status and inc["status"] != status:
                continue
            results.append(IncidentResponse(**inc))
        return sorted(results, key=lambda x: x.created_at, reverse=True)

    def get_incident(self, incident_id: str) -> Optional[IncidentResponse]:
        if incident_id in self.incidents:
            return IncidentResponse(**self.incidents[incident_id])
        return None

    def create_incident(self, data: IncidentCreate) -> IncidentResponse:
        inc_id = f"inc_{uuid.uuid4().hex[:8]}"
        
        # If segment id not provided, snap to nearest segment
        road_seg_id = data.road_segment_id
        if not road_seg_id:
            nearest_node, _ = self.graph_service.find_nearest_node(data.latitude, data.longitude)
            # Find an adjacent edge
            for u, v, edata in self.graph_service.graph.edges(data=True):
                if u == nearest_node or v == nearest_node:
                    road_seg_id = edata.get("segment_id")
                    break

        inc_record = {
            "id": inc_id,
            "incident_type": data.incident_type,
            "title": data.title,
            "description": data.description or "",
            "latitude": data.latitude,
            "longitude": data.longitude,
            "road_segment_id": road_seg_id,
            "severity": data.severity,
            "status": IncidentStatus.REPORTED,
            "verified": False,
            "delay_penalty_sec": data.delay_penalty_sec,
            "blocks_road": data.blocks_road,
            "reported_by": data.reported_by,
            "data_source": "simulation",
            "created_at": datetime.now(timezone.utc),
            "resolved_at": None
        }
        self.incidents[inc_id] = inc_record
        return IncidentResponse(**inc_record)

    def update_incident(self, incident_id: str, updates: IncidentUpdate) -> Optional[IncidentResponse]:
        if incident_id not in self.incidents:
            return None
        inc = self.incidents[incident_id]

        if updates.title is not None:
            inc["title"] = updates.title
        if updates.description is not None:
            inc["description"] = updates.description
        if updates.severity is not None:
            inc["severity"] = updates.severity
        if updates.delay_penalty_sec is not None:
            inc["delay_penalty_sec"] = updates.delay_penalty_sec
        if updates.blocks_road is not None:
            inc["blocks_road"] = updates.blocks_road

        if updates.verified is not None:
            inc["verified"] = updates.verified
            if updates.verified and inc["status"] == IncidentStatus.REPORTED:
                inc["status"] = IncidentStatus.VERIFIED

        if updates.status is not None:
            inc["status"] = updates.status
            if updates.status == IncidentStatus.VERIFIED:
                inc["verified"] = True
            elif updates.status == IncidentStatus.RESOLVED:
                inc["resolved_at"] = datetime.now(timezone.utc)

        # Apply or update graph edge impact if verified and not resolved
        seg_id = inc.get("road_segment_id")
        if seg_id:
            if inc["status"] in [IncidentStatus.VERIFIED, IncidentStatus.UNDER_REVIEW]:
                self.graph_service.apply_incident(
                    seg_id,
                    delay_sec=inc["delay_penalty_sec"],
                    blocks_road=inc["blocks_road"],
                    incident_title=inc["title"]
                )
            elif inc["status"] == IncidentStatus.RESOLVED:
                self.graph_service.clear_incident(seg_id)

        return IncidentResponse(**inc)

    def resolve_incident(self, incident_id: str) -> Optional[IncidentResponse]:
        if incident_id not in self.incidents:
            return None
        inc = self.incidents[incident_id]
        inc["status"] = IncidentStatus.RESOLVED
        inc["resolved_at"] = datetime.now(timezone.utc)
        seg_id = inc.get("road_segment_id")
        if seg_id:
            self.graph_service.clear_incident(seg_id)
        return IncidentResponse(**inc)

incident_service = IncidentService()
