from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.route import RouteCalculationLog
from backend.app.services.routing_engine import routing_engine
from backend.app.services.graph_service import graph_service
from backend.app.schemas.routing import RouteRequest, RouteResult, RouteCompareResponse

router = APIRouter(prefix="/routes", tags=["Route Optimization"])

@router.get("/places")
def get_supported_places():
    """List supported places and landmarks in Hinjawadi & Pune for origin/destination pickers."""
    places = []
    for node_id, data in graph_service.graph.nodes(data=True):
        places.append({
            "id": node_id,
            "name": data["name"],
            "latitude": data["lat"],
            "longitude": data["lon"],
            "type": data.get("intersection_type", "junction")
        })
    return sorted(places, key=lambda x: x["name"])

@router.post("/optimize", response_model=RouteResult)
def optimize_route(req: RouteRequest, db: Session = Depends(get_db)):
    # Resolve origin coords
    start_lat = req.origin_lat
    start_lon = req.origin_lon
    if req.origin_id and req.origin_id in graph_service.graph:
        start_lat = graph_service.graph.nodes[req.origin_id]["lat"]
        start_lon = graph_service.graph.nodes[req.origin_id]["lon"]

    # Resolve destination coords
    end_lat = req.destination_lat
    end_lon = req.destination_lon
    if req.destination_id and req.destination_id in graph_service.graph:
        end_lat = graph_service.graph.nodes[req.destination_id]["lat"]
        end_lon = graph_service.graph.nodes[req.destination_id]["lon"]

    if start_lat is None or start_lon is None or end_lat is None or end_lon is None:
        raise HTTPException(status_code=400, detail="Origin and destination coordinates must be specified.")

    route = routing_engine.optimize_route(
        start_lat=start_lat,
        start_lon=start_lon,
        end_lat=end_lat,
        end_lon=end_lon,
        objective=req.objective
    )

    if not route:
        raise HTTPException(
            status_code=404,
            detail="No feasible route found. Possible road closure or inaccessible coordinates."
        )

    # Log route calculation
    try:
        log_entry = RouteCalculationLog(
            origin_name=req.origin_name or "Origin",
            origin_lat=start_lat,
            origin_lon=start_lon,
            destination_name=req.destination_name or "Destination",
            destination_lat=end_lat,
            destination_lon=end_lon,
            objective=req.objective,
            user_role=req.user_role,
            distance_km=route.total_distance_km,
            travel_time_min=route.estimated_travel_time_minutes,
            baseline_time_min=route.baseline_travel_time_minutes,
            time_savings_pct=route.estimated_time_savings_pct,
            congestion_exposure_pct=route.congestion_exposure_pct,
            computation_latency_ms=route.computation_latency_ms,
            incident_count=route.incidents_encountered
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return route

@router.post("/compare", response_model=RouteCompareResponse)
def compare_routes(req: RouteRequest):
    # Resolve coords
    start_lat = req.origin_lat
    start_lon = req.origin_lon
    if req.origin_id and req.origin_id in graph_service.graph:
        start_lat = graph_service.graph.nodes[req.origin_id]["lat"]
        start_lon = graph_service.graph.nodes[req.origin_id]["lon"]

    end_lat = req.destination_lat
    end_lon = req.destination_lon
    if req.destination_id and req.destination_id in graph_service.graph:
        end_lat = graph_service.graph.nodes[req.destination_id]["lat"]
        end_lon = graph_service.graph.nodes[req.destination_id]["lon"]

    if start_lat is None or start_lon is None or end_lat is None or end_lon is None:
        raise HTTPException(status_code=400, detail="Valid origin and destination coordinates required.")

    result = routing_engine.compare_routes(
        start_lat=start_lat,
        start_lon=start_lon,
        end_lat=end_lat,
        end_lon=end_lon,
        user_role=req.user_role
    )

    if not result:
        raise HTTPException(status_code=404, detail="No feasible routes could be calculated.")

    return result

@router.post("/recalculate", response_model=RouteResult)
def recalculate_route(req: RouteRequest):
    """Dynamic recalculation endpoint triggered when network incidents or traffic updates occur."""
    return optimize_route(req)
