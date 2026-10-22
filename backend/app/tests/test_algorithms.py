import pytest
from backend.app.services.graph_service import GraphService, haversine_distance_meters
from backend.app.services.routing_engine import RoutingEngine

@pytest.fixture
def routing():
    service = GraphService()
    engine = RoutingEngine(service)
    return service, engine

def test_haversine_distance():
    # Shivaji Chowk to Bhumkar Chowk is ~1.8 - 2.0 km straight line
    dist = haversine_distance_meters(18.5912, 73.7389, 18.5982, 73.7548)
    assert 1500 <= dist <= 2500

def test_dijkstra_and_astar_consistency(routing):
    service, engine = routing
    # From Shivaji Chowk to Megapolis Phase 3
    start = "shivaji_chowk"
    end = "megapolis_ph3"

    dijkstra_path = engine.run_dijkstra(start, end, "shortest_distance")
    astar_path = engine.run_astar(start, end, "shortest_distance")

    assert dijkstra_path is not None
    assert astar_path is not None
    assert dijkstra_path[0] == start
    assert dijkstra_path[-1] == end
    assert astar_path[0] == start
    assert astar_path[-1] == end

def test_road_closure_rerouting(routing):
    service, engine = routing
    start = "wakad_bridge"
    end = "hinjawadi_ph1_circle"

    # Baseline path
    normal_route = engine.optimize_route(18.596, 73.748, 18.5885, 73.7250, "fastest_time")
    assert normal_route is not None

    # Now close the primary gateway edge: seg_wakad_bridge_shivaji
    service.apply_incident(
        "seg_wakad_bridge_shivaji",
        delay_sec=1000.0,
        blocks_road=True,
        incident_title="Bridge Collapse / Complete Closure"
    )

    # Calculate rerouted path
    rerouted = engine.optimize_route(18.596, 73.748, 18.5885, 73.7250, "fastest_time")
    assert rerouted is not None

    # The closed segment MUST NOT be in the rerouted segment steps
    used_segments = [s.segment_id for s in rerouted.segments]
    assert "seg_wakad_bridge_shivaji" not in used_segments

    # Cleanup
    service.clear_incident("seg_wakad_bridge_shivaji")

def test_emergency_priority_routing(routing):
    service, engine = routing
    res = engine.optimize_route(18.5982, 73.7548, 18.5772, 73.6891, "emergency_priority")
    assert res is not None
    assert res.is_emergency is True
    assert res.objective == "emergency_priority"
    assert res.total_distance_km > 0
    assert res.estimated_travel_time_minutes > 0

def test_alternative_paths_diversity(routing):
    service, engine = routing
    paths = engine.find_alternative_paths("bhumkar_chowk", "megapolis_ph3", "congestion_aware", k=3)
    assert len(paths) >= 2
    # Ensure they are not identical
    assert paths[0] != paths[1]

def test_admissible_heuristic(routing):
    service, engine = routing
    start = "bhumkar_chowk"
    end = "megapolis_ph3"

    h_val = engine._astar_heuristic(start, end, "shortest_distance")
    # True road distance must be >= straight line heuristic
    path = engine.run_astar(start, end, "shortest_distance")
    true_dist = 0.0
    for i in range(len(path) - 1):
        true_dist += service.graph[path[i]][path[i + 1]]["distance_meters"]

    assert h_val <= true_dist + 1e-5
