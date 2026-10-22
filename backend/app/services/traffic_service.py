from datetime import datetime, timezone
from typing import List, Dict, Any
from backend.app.services.graph_service import graph_service
from backend.app.schemas.network import SegmentResponse, NetworkSummary

class TrafficService:
    def __init__(self, service=graph_service):
        self.graph_service = service
        self.last_updated = datetime.now(timezone.utc)

    def get_current_traffic_segments(self) -> List[SegmentResponse]:
        """Return all directed segments with live speeds, congestion level, and geometry."""
        segments = []
        g = self.graph_service.graph

        for u, v, data in g.edges(data=True):
            speed = data.get("current_speed_kmh", 45.0)
            baseline = data.get("baseline_speed_kmh", 45.0)
            ratio = round(speed / baseline, 2) if baseline > 0 else 1.0
            cong_lvl = data.get("congestion_level", "low")

            seg = SegmentResponse(
                id=data.get("segment_id", f"seg_{u}_{v}"),
                start_node_id=u,
                end_node_id=v,
                name=data.get("name", f"{u} to {v}"),
                road_category=data.get("road_category", "arterial"),
                distance_meters=data.get("distance_meters", 1000.0),
                speed_limit_kmh=data.get("speed_limit_kmh", 50.0),
                baseline_speed_kmh=baseline,
                current_speed_kmh=speed,
                is_one_way=False,
                is_closed=data.get("is_closed", False),
                closure_reason=data.get("closure_reason", None),
                lanes=data.get("lanes", 2),
                congestion_level=cong_lvl,
                speed_ratio=ratio
            )
            segments.append(seg)
        return segments

    def get_network_summary(self) -> NetworkSummary:
        """Return high-level city-wide traffic metrics."""
        g = self.graph_service.graph
        total_nodes = g.number_of_nodes()
        total_segments = g.number_of_edges()

        speeds = [d.get("current_speed_kmh", 45.0) for _, _, d in g.edges(data=True)]
        avg_speed = round(sum(speeds) / len(speeds), 1) if speeds else 45.0

        congested_count = sum(1 for _, _, d in g.edges(data=True) if d.get("congestion_level") in ["heavy", "severe"])
        active_incidents = sum(1 for _, _, d in g.edges(data=True) if d.get("is_affected_by_incident", False))

        freshness_sec = int((datetime.now(timezone.utc) - self.last_updated).total_seconds())

        return NetworkSummary(
            total_nodes=total_nodes,
            total_segments=total_segments,
            active_incidents=active_incidents,
            congested_segments=congested_count,
            average_network_speed_kmh=avg_speed,
            data_freshness_sec=max(freshness_sec, 2),
            mode="SIMULATION MODE (Deterministic Hinjawadi Model)",
            city="Pune, Maharashtra, India",
            area="Hinjawadi IT Corridor"
        )

traffic_service = TrafficService()
