import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_and_health(client):
    r1 = client.get("/")
    assert r1.status_code == 200
    assert "Hinjawadi" in r1.json()["area"]

    r2 = client.get("/api/v1/system/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "healthy"

def test_map_endpoints(client):
    r_nodes = client.get("/api/v1/map/nodes")
    assert r_nodes.status_code == 200
    nodes = r_nodes.json()
    assert len(nodes) >= 15
    # Verify Shivaji Chowk exists
    node_ids = [n["id"] for n in nodes]
    assert "shivaji_chowk" in node_ids

    r_roads = client.get("/api/v1/map/roads")
    assert r_roads.status_code == 200
    assert len(r_roads.json()) >= 15

    r_summary = client.get("/api/v1/map/summary")
    assert r_summary.status_code == 200
    assert r_summary.json()["city"] == "Pune, Maharashtra, India"

def test_routing_optimization_and_compare(client):
    # Optimize route from Wakad to Phase 3 Megapolis
    payload = {
        "origin_id": "wakad_flyover",
        "destination_id": "megapolis_ph3",
        "objective": "congestion_aware",
        "user_role": "commuter"
    }
    r_opt = client.post("/api/v1/routes/optimize", json=payload)
    assert r_opt.status_code == 200
    data = r_opt.json()
    assert data["total_distance_km"] > 0
    assert data["estimated_travel_time_minutes"] > 0
    assert len(data["segments"]) > 0

    # Compare routes
    r_comp = client.post("/api/v1/routes/compare", json=payload)
    assert r_comp.status_code == 200
    comp_data = r_comp.json()
    assert len(comp_data["routes"]) >= 2
    assert "origin" in comp_data
    assert "destination" in comp_data

def test_incident_lifecycle(client):
    # 1. Create incident
    inc_payload = {
        "incident_type": "accident",
        "title": "Minor Car Breakdown on Phase 2 Road",
        "description": "Vehicle on shoulder",
        "latitude": 18.5833,
        "longitude": 73.7082,
        "road_segment_id": "seg_ph1_wipro_ph2",
        "severity": "low",
        "delay_penalty_sec": 120.0,
        "blocks_road": False,
        "reported_by": "Traffic Patrol"
    }
    create_res = client.post("/api/v1/incidents", json=inc_payload)
    assert create_res.status_code == 200
    inc_data = create_res.json()
    inc_id = inc_data["id"]
    assert inc_data["status"] == "reported"

    # 2. Verify incident (Operator action)
    update_res = client.patch(f"/api/v1/incidents/{inc_id}", json={"verified": True, "severity": "medium"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "verified"

    # 3. Resolve incident
    resolve_res = client.post(f"/api/v1/incidents/{inc_id}/resolve")
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"

def test_signals_and_simulation(client):
    # Signals
    sig_res = client.get("/api/v1/signals")
    assert sig_res.status_code == 200
    signals = sig_res.json()
    assert len(signals) >= 4

    # Simulate adaptive timing on first signal
    sim_req = {
        "signal_id": signals[0]["id"],
        "incoming_vehicle_demand_vph": 1600,
        "proposed_green_split": 60
    }
    sim_res = client.post("/api/v1/signals/simulate-adaptive", json=sim_req)
    assert sim_res.status_code == 200
    assert sim_res.json()["delay_reduction_pct"] > 0

    # Simulation scenarios
    sc_res = client.get("/api/v1/simulation/scenarios")
    assert sc_res.status_code == 200
    scenarios = sc_res.json()
    assert len(scenarios) >= 4

    # Switch scenario to evening peak
    switch_res = client.post("/api/v1/simulation/scenario", json={"scenario_id": "evening_peak"})
    assert switch_res.status_code == 200
    assert switch_res.json()["id"] == "evening_peak"

def test_analytics_and_ai_model(client):
    ov_res = client.get("/api/v1/analytics/overview")
    assert ov_res.status_code == 200
    assert ov_res.json()["total_monitored_segments"] > 0

    cong_res = client.get("/api/v1/analytics/congestion")
    assert cong_res.status_code == 200
    assert len(cong_res.json()) >= 3

    pred_res = client.get("/api/v1/analytics/prediction-model")
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["is_trained"] is True
    assert "mae_seconds" in pred_data["ml_model"]
    assert "baseline_model" in pred_data
