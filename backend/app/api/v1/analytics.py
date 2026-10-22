from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.traffic_service import traffic_service
from backend.app.services.prediction_service import prediction_service
from backend.app.services.graph_service import graph_service
from backend.app.schemas.analytics import DashboardOverview, CongestionCategoryData, TravelTimeTrendPoint, OptimizationSavings

router = APIRouter(prefix="/analytics", tags=["Traffic Analytics & AI"])

@router.get("/overview", response_model=DashboardOverview)
def get_analytics_overview():
    summary = traffic_service.get_network_summary()
    return DashboardOverview(
        total_monitored_segments=summary.total_segments,
        current_congested_segments=summary.congested_segments,
        active_incidents=summary.active_incidents,
        average_travel_time_min=round((12.5 / (summary.average_network_speed_kmh / 60)), 1),
        estimated_network_delay_sec=round(summary.congested_segments * 180.0, 0),
        traffic_data_freshness_sec=summary.data_freshness_sec,
        route_optimization_requests_24h=1480,
        system_status="OPTIMAL - All Systems Operational",
        simulation_mode=True,
        city="Pune, Maharashtra, India",
        area="Hinjawadi IT Corridor"
    )

@router.get("/congestion", response_model=List[CongestionCategoryData])
def get_congestion_by_category():
    categories = ["expressway", "arterial", "sub_arterial", "local"]
    data = []
    g = graph_service.graph

    for cat in categories:
        edges = [d for _, _, d in g.edges(data=True) if d.get("road_category") == cat]
        if not edges:
            continue
        speeds = [e.get("current_speed_kmh", 40.0) for e in edges]
        base_speeds = [e.get("baseline_speed_kmh", 50.0) for e in edges]
        avg_s = round(sum(speeds) / len(speeds), 1)
        avg_b = round(sum(base_speeds) / len(base_speeds), 1)
        ratio = round(avg_s / avg_b, 2) if avg_b > 0 else 1.0

        data.append(CongestionCategoryData(
            category=cat.replace("_", " ").title(),
            road_count=len(edges),
            avg_speed_kmh=avg_s,
            congestion_ratio=ratio
        ))
    return data

@router.get("/travel-times", response_model=List[TravelTimeTrendPoint])
def get_travel_time_trends():
    """24-Hour travel time curve across Hinjawadi spine (Wakad to Phase 3 Megapolis)."""
    # 24-hour profile reflecting Hinjawadi IT commute
    hours_profile = [
        ("00:00", 12.0, 11.5, 0.1),
        ("02:00", 11.5, 11.2, 0.05),
        ("04:00", 11.8, 11.4, 0.08),
        ("06:00", 13.5, 12.0, 0.2),
        ("07:00", 18.0, 14.5, 0.4),
        ("08:00", 28.5, 19.2, 0.75),
        ("09:00", 42.0, 24.5, 0.95),  # Morning IT Peak
        ("10:00", 38.0, 22.0, 0.88),
        ("11:00", 24.0, 17.5, 0.55),
        ("12:00", 19.5, 15.0, 0.35),
        ("14:00", 18.0, 14.2, 0.30),
        ("16:00", 23.5, 17.0, 0.50),
        ("17:00", 34.0, 21.5, 0.78),
        ("18:00", 46.5, 26.0, 0.98),  # Evening Departure Peak
        ("19:00", 44.0, 25.5, 0.92),
        ("20:00", 32.0, 20.0, 0.68),
        ("21:00", 22.0, 16.0, 0.45),
        ("22:00", 16.0, 13.5, 0.25),
        ("23:00", 13.0, 12.0, 0.15)
    ]
    return [
        TravelTimeTrendPoint(
            hour=h,
            observed_time_min=obs,
            optimized_time_min=opt,
            congestion_index=ci
        )
        for h, obs, opt, ci in hours_profile
    ]

@router.get("/optimization-performance", response_model=OptimizationSavings)
def get_optimization_performance():
    return OptimizationSavings(
        total_queries=1480,
        avg_time_savings_pct=28.4,
        total_hours_saved=624.5,
        co2_reduction_kg=1498.0
    )

@router.get("/prediction-model")
def get_prediction_model_details():
    """Return Scikit-Learn training evaluation metrics and baseline comparison."""
    return prediction_service.get_evaluation_report()
