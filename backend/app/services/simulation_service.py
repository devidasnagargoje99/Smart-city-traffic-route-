from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from backend.app.schemas.simulation import SimulationScenario
from backend.app.services.graph_service import graph_service
from backend.app.services.incident_service import incident_service

class SimulationService:
    def __init__(self, g_service=graph_service, inc_service=incident_service):
        self.graph_service = g_service
        self.incident_service = inc_service
        self.current_scenario_id = "morning_peak"
        self.simulated_clock = "09:15"

        self.scenarios: Dict[str, SimulationScenario] = {
            "off_peak": SimulationScenario(
                id="off_peak",
                name="Midday Off-Peak Flow (14:00)",
                description="Moderate regular traffic across Hinjawadi IT Park corridors with minimal bottleneck delays.",
                time_of_day="14:00",
                rush_hour_factor=0.9,
                rain_factor=1.0,
                active_bottlenecks=[]
            ),
            "morning_peak": SimulationScenario(
                id="morning_peak",
                name="Morning Inbound IT Rush Hour (09:15)",
                description="High influx of IT workforce from Pune city, Wakad, and Baner entering Hinjawadi Phase 1, 2, and 3. Severe congestion at Shivaji Chowk and Bhumkar Chowk.",
                time_of_day="09:15",
                rush_hour_factor=0.38,
                rain_factor=1.0,
                active_bottlenecks=["seg_wakad_bridge_shivaji", "seg_bhumkar_wakad_bridge", "seg_shivaji_blueridge"]
            ),
            "evening_peak": SimulationScenario(
                id="evening_peak",
                name="Evening Outbound Exodus (18:45)",
                description="Heavy outbound queue departing Megapolis Phase 3 and Wipro Phase 2 towards Mumbai-Bangalore Highway and Wakad.",
                time_of_day="18:45",
                rush_hour_factor=0.35,
                rain_factor=1.0,
                active_bottlenecks=["seg_ph1_wipro_ph2", "seg_quadron_megapolis", "seg_wakad_bridge_shivaji"]
            ),
            "monsoon_waterlogging": SimulationScenario(
                id="monsoon_waterlogging",
                name="Monsoon Downpour & Waterlogging (19:30)",
                description="Heavy monsoon rains causing 40cm waterlogging at Bhumkar underpass and Shivaji Chowk roundabout. Speeds drop drastically across low-lying roads.",
                time_of_day="19:30",
                rush_hour_factor=0.30,
                rain_factor=0.55,
                active_bottlenecks=["seg_bhumkar_wakad_bridge", "seg_bhumkar_suratwala", "seg_wakad_bridge_shivaji"]
            ),
            "road_closure_incident": SimulationScenario(
                id="road_closure_incident",
                name="Major Chokepoint Closure at Shivaji Gateway",
                description="Tanker breakdown and infrastructure emergency completely blocks the Hinjawadi Flyover approach. Tests automatic dynamic rerouting through northern Marunji and Punawale bypass corridors.",
                time_of_day="10:00",
                rush_hour_factor=0.45,
                rain_factor=1.0,
                active_bottlenecks=["seg_wakad_bridge_shivaji"]
            )
        }
        # Apply initial morning peak
        self.apply_scenario("morning_peak")

    def list_scenarios(self) -> List[SimulationScenario]:
        return list(self.scenarios.values())

    def get_current_scenario(self) -> SimulationScenario:
        return self.scenarios[self.current_scenario_id]

    def apply_scenario(self, scenario_id: str) -> SimulationScenario:
        if scenario_id not in self.scenarios:
            scenario_id = "morning_peak"

        self.current_scenario_id = scenario_id
        sc = self.scenarios[scenario_id]
        self.simulated_clock = sc.time_of_day

        g = self.graph_service.graph

        for u, v, data in g.edges(data=True):
            base_speed = data.get("baseline_speed_kmh", 45.0)
            seg_id = data.get("segment_id")

            # Check if this segment is a designated bottleneck in this scenario
            if seg_id in sc.active_bottlenecks:
                # Severe congestion
                speed = max(8.0, base_speed * sc.rush_hour_factor * sc.rain_factor * 0.65)
            else:
                # Normal network scaling
                speed = max(18.0, base_speed * sc.rush_hour_factor * sc.rain_factor)

            data["current_speed_kmh"] = round(speed, 1)

            # Special closure handling for road_closure_incident
            if scenario_id == "road_closure_incident" and seg_id == "seg_wakad_bridge_shivaji":
                data["is_closed"] = True
                data["closure_reason"] = "EMERGENCY: Tanker Breakdown & Road Blockade"
            else:
                # If it wasn't an explicit external incident closure, clear simulated scenario closure
                if data.get("closure_reason") == "EMERGENCY: Tanker Breakdown & Road Blockade":
                    data["is_closed"] = False
                    data["closure_reason"] = None

        self.graph_service.recompute_edge_weights()
        return sc

simulation_service = SimulationService()
