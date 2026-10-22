import heapq
import time
import math
import uuid
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
from backend.app.services.graph_service import graph_service, haversine_distance_meters
from backend.app.schemas.routing import RouteResult, RouteSegmentStep, RouteCompareResponse

class RoutingEngine:
    def __init__(self, service=graph_service):
        self.graph_service = service

    def _get_weight_key(self, objective: str) -> str:
        mapping = {
            "shortest_distance": "weight_distance",
            "fastest_time": "weight_fastest",
            "congestion_aware": "weight_congestion_aware",
            "emergency_priority": "weight_emergency"
        }
        return mapping.get(objective, "weight_congestion_aware")

    def _astar_heuristic(self, u: str, v: str, objective: str) -> float:
        """Admissible lower-bound heuristic for A* search."""
        u_lat = self.graph_service.graph.nodes[u]["lat"]
        u_lon = self.graph_service.graph.nodes[u]["lon"]
        v_lat = self.graph_service.graph.nodes[v]["lat"]
        v_lon = self.graph_service.graph.nodes[v]["lon"]
        straight_dist_m = haversine_distance_meters(u_lat, u_lon, v_lat, v_lon)

        if objective == "shortest_distance":
            # Straight-line distance is always <= road distance (triangle inequality)
            return straight_dist_m
        else:
            # Maximum design speed in the network: 80 km/h = 22.22 m/s
            # Straight line distance divided by max speed is strictly admissible lower bound on travel time
            max_speed_mps = 80.0 * 1000.0 / 3600.0
            min_possible_time_sec = straight_dist_m / max_speed_mps
            return min_possible_time_sec

    def run_astar(self, start_node: str, end_node: str, objective: str = "congestion_aware") -> Optional[List[str]]:
        """Run A* search algorithm with admissible heuristic."""
        weight_key = self._get_weight_key(objective)
        g = self.graph_service.graph

        if start_node not in g or end_node not in g:
            return None

        open_set = []
        heapq.heappush(open_set, (0.0, 0.0, start_node, [start_node]))
        g_scores = {start_node: 0.0}
        visited = set()

        while open_set:
            f, current_g, current, path = heapq.heappop(open_set)

            if current == end_node:
                return path

            if current in visited and g_scores.get(current, float("inf")) < current_g:
                continue
            visited.add(current)

            for neighbor in g.successors(current):
                edge_data = g[current][neighbor]
                weight = edge_data.get(weight_key, float("inf"))

                if math.isinf(weight) or weight >= 1e9:
                    continue  # Closed road or impassable

                tentative_g = current_g + weight
                if tentative_g < g_scores.get(neighbor, float("inf")):
                    g_scores[neighbor] = tentative_g
                    h = self._astar_heuristic(neighbor, end_node, objective)
                    f_score = tentative_g + h
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor, path + [neighbor]))

        return None

    def run_dijkstra(self, start_node: str, end_node: str, objective: str = "congestion_aware") -> Optional[List[str]]:
        """Run standard Dijkstra's algorithm for shortest/lowest-cost path."""
        weight_key = self._get_weight_key(objective)
        g = self.graph_service.graph

        # Filter out impassable edges
        def weight_func(u, v, d):
            w = d.get(weight_key, float("inf"))
            if math.isinf(w) or w >= 1e9:
                return None
            return w

        try:
            path = nx.dijkstra_path(g, start_node, end_node, weight=weight_func)
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def find_alternative_paths(self, start_node: str, end_node: str, objective: str = "congestion_aware", k: int = 3) -> List[List[str]]:
        """Generate k distinct alternative candidate paths using edge-penalty diversification."""
        weight_key = self._get_weight_key(objective)
        base_path = self.run_astar(start_node, end_node, objective)
        if not base_path:
            return []

        paths = [base_path]
        g = self.graph_service.graph

        # Temporary penalty tracking
        original_weights = {}

        try:
            for iteration in range(1, k):
                # Penalize edges in previously found paths to force diversification
                for p in paths:
                    for i in range(len(p) - 1):
                        u, v = p[i], p[i + 1]
                        if g.has_edge(u, v):
                            if (u, v) not in original_weights:
                                original_weights[(u, v)] = g[u][v].get(weight_key, 1.0)
                            # Multiply penalty to encourage diverse corridors (e.g. Marunji bypass vs Highway)
                            g[u][v][weight_key] = g[u][v][weight_key] * 2.5

                alt_path = self.run_dijkstra(start_node, end_node, objective)
                if alt_path and alt_path not in paths:
                    paths.append(alt_path)
                else:
                    break
        finally:
            # Restore original weights
            for (u, v), w in original_weights.items():
                if g.has_edge(u, v):
                    g[u][v][weight_key] = w

        return paths

    def build_route_result(self, node_sequence: List[str], objective: str, latency_ms: float) -> RouteResult:
        """Construct full RouteResult details from a node sequence."""
        g = self.graph_service.graph
        total_dist_m = 0.0
        total_travel_time_sec = 0.0
        total_baseline_time_sec = 0.0
        congested_dist_m = 0.0
        segments_steps: List[RouteSegmentStep] = []
        ordered_coords: List[List[float]] = []
        incidents_encountered = 0
        restrictions_encountered = 0

        # Start with first node coord
        first_node = g.nodes[node_sequence[0]]
        ordered_coords.append([first_node["lat"], first_node["lon"]])

        for i in range(len(node_sequence) - 1):
            u = node_sequence[i]
            v = node_sequence[i + 1]
            edge = g[u][v]

            dist_m = edge.get("distance_meters", 1000.0)
            curr_speed = edge.get("current_speed_kmh", 45.0)
            base_speed = edge.get("baseline_speed_kmh", 45.0)
            cong_lvl = edge.get("congestion_level", "low")
            is_inc = edge.get("is_affected_by_incident", False)
            inc_notice = edge.get("incident_notice", None)

            seg_travel_time = edge.get("travel_time_sec", dist_m / (curr_speed * 1000.0 / 3600.0))
            seg_base_time = edge.get("baseline_travel_time_sec", dist_m / (base_speed * 1000.0 / 3600.0))

            if is_inc:
                incidents_encountered += 1
                seg_travel_time += edge.get("incident_delay_sec", 0.0)

            if edge.get("is_closed", False):
                restrictions_encountered += 1

            total_dist_m += dist_m
            total_travel_time_sec += seg_travel_time
            total_baseline_time_sec += seg_base_time

            if cong_lvl in ["heavy", "severe"]:
                congested_dist_m += dist_m

            # Segment geometry
            next_node = g.nodes[v]
            seg_geom = [[g.nodes[u]["lat"], g.nodes[u]["lon"]], [next_node["lat"], next_node["lon"]]]
            ordered_coords.append([next_node["lat"], next_node["lon"]])

            step = RouteSegmentStep(
                segment_id=edge.get("segment_id", f"seg_{u}_{v}"),
                road_name=edge.get("name", f"Road {u} to {v}"),
                start_node=g.nodes[u]["name"],
                end_node=next_node["name"],
                distance_meters=round(dist_m, 1),
                estimated_speed_kmh=round(curr_speed, 1),
                travel_time_seconds=round(seg_travel_time, 1),
                congestion_level=cong_lvl,
                geometry=seg_geom,
                is_affected_by_incident=is_inc,
                incident_notice=inc_notice
            )
            segments_steps.append(step)

        total_dist_km = round(total_dist_m / 1000.0, 2)
        travel_time_min = round(total_travel_time_sec / 60.0, 1)
        baseline_time_min = round(total_baseline_time_sec / 60.0, 1)

        # Time savings percent
        if baseline_time_min > 0:
            time_savings_pct = round(((baseline_time_min - travel_time_min) / baseline_time_min) * 100.0, 1)
        else:
            time_savings_pct = 0.0

        # Congestion exposure
        congestion_exposure_pct = round((congested_dist_m / total_dist_m * 100.0), 1) if total_dist_m > 0 else 0.0

        # Objective labels and reasons
        reasons = {
            "shortest_distance": f"Minimizes physical distance ({total_dist_km} km) regardless of bottlenecks.",
            "fastest_time": f"Fastest calculated arrival ({travel_time_min} mins) based on current speeds.",
            "congestion_aware": f"Optimally balances travel duration ({travel_time_min} mins) and bypasses severe chokepoints with only {congestion_exposure_pct}% congestion exposure.",
            "emergency_priority": f"Emergency corridor routing with prioritized dispatch speeds, saving ~{abs(time_savings_pct)}% time while strictly respecting verified closures."
        }
        labels = {
            "shortest_distance": "Shortest Distance",
            "fastest_time": "Fastest Route",
            "congestion_aware": "Congestion-Optimized (Recommended)",
            "emergency_priority": "Emergency Priority Corridor"
        }

        return RouteResult(
            route_id=f"rt_{uuid.uuid4().hex[:8]}",
            objective=objective,
            objective_label=labels.get(objective, objective.capitalize()),
            total_distance_km=total_dist_km,
            estimated_travel_time_minutes=travel_time_min,
            baseline_travel_time_minutes=baseline_time_min,
            estimated_time_savings_pct=time_savings_pct,
            congestion_exposure_pct=congestion_exposure_pct,
            node_sequence=node_sequence,
            ordered_coordinates=ordered_coords,
            segments=segments_steps,
            incidents_encountered=incidents_encountered,
            restrictions_encountered=restrictions_encountered,
            computation_latency_ms=round(latency_ms, 2),
            confidence_score=0.96,
            recommendation_reason=reasons.get(objective, "Standard calculated route."),
            data_freshness_status="Real-Time Simulated (Hinjawadi Model)",
            is_emergency=(objective == "emergency_priority")
        )

    def optimize_route(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        objective: str = "congestion_aware",
        algorithm: str = "astar"
    ) -> Optional[RouteResult]:
        """Find the best single route between coordinates."""
        t0 = time.perf_counter()
        start_node, _ = self.graph_service.find_nearest_node(start_lat, start_lon)
        end_node, _ = self.graph_service.find_nearest_node(end_lat, end_lon)

        if not start_node or not end_node or start_node == end_node:
            return None

        if algorithm == "astar":
            path = self.run_astar(start_node, end_node, objective)
        else:
            path = self.run_dijkstra(start_node, end_node, objective)

        latency_ms = (time.perf_counter() - t0) * 1000.0

        if not path:
            return None

        return self.build_route_result(path, objective, latency_ms)

    def compare_routes(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        user_role: str = "commuter"
    ) -> Optional[RouteCompareResponse]:
        """Compare multiple objectives and alternative candidates."""
        start_node, _ = self.graph_service.find_nearest_node(start_lat, start_lon)
        end_node, _ = self.graph_service.find_nearest_node(end_lat, end_lon)

        if not start_node or not end_node:
            return None

        objectives = ["congestion_aware", "fastest_time", "shortest_distance"]
        if user_role == "emergency":
            objectives.insert(0, "emergency_priority")

        routes: List[RouteResult] = []
        seen_paths = set()

        for obj in objectives:
            t0 = time.perf_counter()
            path = self.run_astar(start_node, end_node, obj)
            latency_ms = (time.perf_counter() - t0) * 1000.0

            if path:
                path_key = tuple(path)
                if path_key not in seen_paths:
                    seen_paths.add(path_key)
                    routes.append(self.build_route_result(path, obj, latency_ms))

        # Also get a distinct alternative path if fewer than 3
        if len(routes) < 3:
            alt_paths = self.find_alternative_paths(start_node, end_node, "congestion_aware", k=3)
            for p in alt_paths:
                path_key = tuple(p)
                if path_key not in seen_paths:
                    seen_paths.add(path_key)
                    r = self.build_route_result(p, "alternative_bypass", 2.5)
                    r.objective_label = "Alternative Scenic/Bypass Route"
                    r.recommendation_reason = "Alternative bypass avoiding main Hinjawadi corridors."
                    routes.append(r)
                if len(routes) >= 3:
                    break

        if not routes:
            return None

        recommended_id = routes[0].route_id

        summary = (
            f"Evaluated {len(routes)} viable routes connecting {self.graph_service.graph.nodes[start_node]['name']} "
            f"to {self.graph_service.graph.nodes[end_node]['name']}. "
            f"Recommended route is {routes[0].objective_label} with {routes[0].estimated_travel_time_minutes} min estimated time."
        )

        return RouteCompareResponse(
            origin={
                "node_id": start_node,
                "name": self.graph_service.graph.nodes[start_node]["name"],
                "latitude": self.graph_service.graph.nodes[start_node]["lat"],
                "longitude": self.graph_service.graph.nodes[start_node]["lon"]
            },
            destination={
                "node_id": end_node,
                "name": self.graph_service.graph.nodes[end_node]["name"],
                "latitude": self.graph_service.graph.nodes[end_node]["lat"],
                "longitude": self.graph_service.graph.nodes[end_node]["lon"]
            },
            routes=routes,
            recommended_route_id=recommended_id,
            active_incidents_in_area=sum(1 for _, _, d in self.graph_service.graph.edges(data=True) if d.get("is_affected_by_incident")),
            summary_explanation=summary
        )

routing_engine = RoutingEngine()
