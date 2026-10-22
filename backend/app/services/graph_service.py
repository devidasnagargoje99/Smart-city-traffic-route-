import json
import math
import os
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
from backend.app.core.config import settings

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in meters between two points on the earth."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class GraphService:
    def __init__(self, data_path: Optional[str] = None):
        self.graph = nx.DiGraph()
        self.nodes_data: Dict[str, Dict[str, Any]] = {}
        self.segments_data: Dict[str, Dict[str, Any]] = {}
        self.default_data_path = data_path or os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "data", "hinjawadi_network.json"
        )
        self.load_network()

    def load_network(self):
        """Load network nodes and edges from json file and initialize graph."""
        if not os.path.exists(self.default_data_path):
            return

        with open(self.default_data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.nodes_data = {n["id"]: n for n in data.get("nodes", [])}
        self.segments_data = {s["id"]: s for s in data.get("segments", [])}

        self.graph.clear()

        # Add nodes with geographic attributes
        for node_id, node in self.nodes_data.items():
            self.graph.add_node(
                node_id,
                name=node["name"],
                lat=node["latitude"],
                lon=node["longitude"],
                intersection_type=node.get("intersection_type", "junction"),
                has_signal=node.get("has_signal", False)
            )

        # Add directed edges (both ways if not one-way)
        for seg_id, seg in self.segments_data.items():
            u = seg["start_node_id"]
            v = seg["end_node_id"]
            dist_m = seg["distance_meters"]
            speed_limit = seg.get("speed_limit_kmh", 50.0)
            baseline_speed = seg.get("baseline_speed_kmh", 45.0)
            current_speed = seg.get("current_speed_kmh", baseline_speed)

            # Ensure coordinates polyline exists
            start_coord = [self.nodes_data[u]["latitude"], self.nodes_data[u]["longitude"]]
            end_coord = [self.nodes_data[v]["latitude"], self.nodes_data[v]["longitude"]]
            geometry = [start_coord, end_coord]

            edge_attrs = {
                "segment_id": seg_id,
                "name": seg["name"],
                "road_category": seg.get("road_category", "arterial"),
                "distance_meters": dist_m,
                "speed_limit_kmh": speed_limit,
                "baseline_speed_kmh": baseline_speed,
                "current_speed_kmh": current_speed,
                "is_closed": seg.get("is_closed", False),
                "closure_reason": seg.get("closure_reason", None),
                "incident_delay_sec": 0.0,
                "is_affected_by_incident": False,
                "incident_notice": None,
                "geometry": geometry,
                "lanes": seg.get("lanes", 2)
            }

            self._add_or_update_edge(u, v, edge_attrs)
            if not seg.get("is_one_way", False):
                # Reverse direction
                rev_attrs = edge_attrs.copy()
                rev_attrs["geometry"] = [end_coord, start_coord]
                self._add_or_update_edge(v, u, rev_attrs)

        self.recompute_edge_weights()

    def _add_or_update_edge(self, u: str, v: str, attrs: Dict[str, Any]):
        self.graph.add_edge(u, v, **attrs)

    def recompute_edge_weights(self):
        """Calculate dynamic routing costs for each edge based on live speed and incidents."""
        for u, v, data in self.graph.edges(data=True):
            dist_m = data["distance_meters"]
            curr_speed = max(data.get("current_speed_kmh", 10.0), 5.0)
            base_speed = max(data.get("baseline_speed_kmh", 45.0), 10.0)
            is_closed = data.get("is_closed", False)
            inc_delay = data.get("incident_delay_sec", 0.0)

            # Pure travel time in seconds
            travel_time_sec = dist_m / (curr_speed * 1000.0 / 3600.0)
            baseline_travel_time_sec = dist_m / (base_speed * 1000.0 / 3600.0)

            speed_ratio = curr_speed / base_speed

            # Congestion Penalty calculation
            if speed_ratio >= 0.8:
                congestion_level = "low"
                congestion_penalty_sec = 0.0
            elif speed_ratio >= 0.5:
                congestion_level = "moderate"
                congestion_penalty_sec = 0.3 * travel_time_sec
            elif speed_ratio >= 0.25:
                congestion_level = "heavy"
                congestion_penalty_sec = 0.9 * travel_time_sec
            else:
                congestion_level = "severe"
                congestion_penalty_sec = 2.2 * travel_time_sec

            data["travel_time_sec"] = travel_time_sec
            data["baseline_travel_time_sec"] = baseline_travel_time_sec
            data["congestion_level"] = congestion_level
            data["speed_ratio"] = round(speed_ratio, 2)

            # Weight models for different objectives
            if is_closed:
                data["weight_distance"] = float("inf")
                data["weight_fastest"] = float("inf")
                data["weight_congestion_aware"] = float("inf")
                data["weight_emergency"] = float("inf")
            else:
                # 1. Shortest distance in meters
                data["weight_distance"] = dist_m

                # 2. Fastest travel time in seconds
                data["weight_fastest"] = travel_time_sec + inc_delay

                # 3. Congestion-aware cost = travel_time + congestion_penalty + inc_delay
                data["weight_congestion_aware"] = travel_time_sec + congestion_penalty_sec + (inc_delay * 1.5)

                # 4. Emergency priority: emergency vehicles travel at prioritized speed,
                # disregard routine congestion queues, but must route around active blockades
                emergency_speed = max(curr_speed * 1.35, min(data["speed_limit_kmh"] * 1.2, 80.0))
                emergency_travel_time = dist_m / (emergency_speed * 1000.0 / 3600.0)
                data["weight_emergency"] = emergency_travel_time + (inc_delay * 0.5)

    def find_nearest_node(self, lat: float, lon: float) -> Tuple[str, float]:
        """Find the nearest graph node to given coordinates and distance in meters."""
        best_node = None
        min_dist = float("inf")
        for node_id, data in self.graph.nodes(data=True):
            dist = haversine_distance_meters(lat, lon, data["lat"], data["lon"])
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node, min_dist

    def update_segment_traffic(self, segment_id: str, new_speed_kmh: float, congestion_level: Optional[str] = None):
        """Update live speed on a segment and recompute weights."""
        for u, v, data in self.graph.edges(data=True):
            if data.get("segment_id") == segment_id:
                data["current_speed_kmh"] = new_speed_kmh
        self.recompute_edge_weights()

    def apply_incident(self, segment_id: str, delay_sec: float, blocks_road: bool, incident_title: str):
        """Apply incident impact or road closure on segment edges."""
        for u, v, data in self.graph.edges(data=True):
            if data.get("segment_id") == segment_id:
                data["incident_delay_sec"] = delay_sec
                data["is_affected_by_incident"] = True
                data["incident_notice"] = incident_title
                if blocks_road:
                    data["is_closed"] = True
                    data["closure_reason"] = f"Incident: {incident_title}"
        self.recompute_edge_weights()

    def clear_incident(self, segment_id: str):
        """Remove incident penalties from segment edges."""
        for u, v, data in self.graph.edges(data=True):
            if data.get("segment_id") == segment_id:
                data["incident_delay_sec"] = 0.0
                data["is_affected_by_incident"] = False
                data["incident_notice"] = None
                data["is_closed"] = False
                data["closure_reason"] = None
        self.recompute_edge_weights()

# Global graph service instance
graph_service = GraphService()
