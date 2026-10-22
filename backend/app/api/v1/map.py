from fastapi import APIRouter
from typing import List
from backend.app.services.traffic_service import traffic_service
from backend.app.services.graph_service import graph_service
from backend.app.schemas.network import NodeResponse, SegmentResponse, NetworkSummary

router = APIRouter(prefix="/map", tags=["Interactive Map & Network"])

@router.get("/summary", response_model=NetworkSummary)
def get_map_summary():
    return traffic_service.get_network_summary()

@router.get("/nodes", response_model=List[NodeResponse])
def get_network_nodes():
    nodes = []
    for node_id, data in graph_service.graph.nodes(data=True):
        nodes.append(NodeResponse(
            id=node_id,
            name=data["name"],
            latitude=data["lat"],
            longitude=data["lon"],
            intersection_type=data.get("intersection_type", "junction"),
            has_signal=data.get("has_signal", False)
        ))
    return sorted(nodes, key=lambda n: n.name)

@router.get("/roads", response_model=List[SegmentResponse])
def get_network_roads():
    return traffic_service.get_current_traffic_segments()

@router.get("/traffic")
def get_live_traffic_state():
    summary = traffic_service.get_network_summary()
    segments = traffic_service.get_current_traffic_segments()
    return {
        "summary": summary,
        "segments": segments
    }
