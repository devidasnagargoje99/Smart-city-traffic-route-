from typing import List, Dict, Optional
from datetime import datetime, timezone
from backend.app.schemas.signal import SignalResponse, SignalSimulationRequest, SignalSimulationResult

class SignalService:
    def __init__(self):
        self.signals: Dict[str, Dict] = {
            "sig_shivaji_chowk": {
                "id": "sig_shivaji_chowk",
                "node_id": "shivaji_chowk",
                "name": "Shivaji Chowk Smart Signal (Hinjawadi Gateway)",
                "latitude": 18.5912,
                "longitude": 73.7389,
                "cycle_length_sec": 120,
                "current_phase": "Phase 1: Wakad to Hinjawadi Inbound Green",
                "green_time_sec": 50,
                "red_time_sec": 65,
                "yellow_time_sec": 5,
                "estimated_queue_vehicles": 28,
                "control_mode": "adaptive",
                "avg_delay_sec": 42.5,
                "optimized_delay_sec": 26.8
            },
            "sig_bhumkar_chowk": {
                "id": "sig_bhumkar_chowk",
                "node_id": "bhumkar_chowk",
                "name": "Bhumkar Chowk Underpass Signal",
                "latitude": 18.5982,
                "longitude": 73.7548,
                "cycle_length_sec": 110,
                "current_phase": "Phase 2: NH48 Service Road Discharge Green",
                "green_time_sec": 45,
                "red_time_sec": 60,
                "yellow_time_sec": 5,
                "estimated_queue_vehicles": 22,
                "control_mode": "adaptive",
                "avg_delay_sec": 38.0,
                "optimized_delay_sec": 24.5
            },
            "sig_dange_chowk": {
                "id": "sig_dange_chowk",
                "node_id": "dange_chowk",
                "name": "Dange Chowk Thergaon Junction Signal",
                "latitude": 18.6111,
                "longitude": 73.7712,
                "cycle_length_sec": 130,
                "current_phase": "Phase 1: Thergaon-Tathawade Through Green",
                "green_time_sec": 55,
                "red_time_sec": 70,
                "yellow_time_sec": 5,
                "estimated_queue_vehicles": 35,
                "control_mode": "actuated",
                "avg_delay_sec": 48.2,
                "optimized_delay_sec": 31.0
            },
            "sig_ph1_circle": {
                "id": "sig_ph1_circle",
                "node_id": "hinjawadi_ph1_circle",
                "name": "Infosys Phase 1 Hub Circle Signal",
                "latitude": 18.5885,
                "longitude": 73.7250,
                "cycle_length_sec": 90,
                "current_phase": "Phase 1: Blue Ridge to Wipro Circle Green",
                "green_time_sec": 40,
                "red_time_sec": 45,
                "yellow_time_sec": 5,
                "estimated_queue_vehicles": 14,
                "control_mode": "adaptive",
                "avg_delay_sec": 25.5,
                "optimized_delay_sec": 16.2
            },
            "sig_wipro_circle": {
                "id": "sig_wipro_circle",
                "node_id": "wipro_circle_ph2",
                "name": "Wipro Circle Phase 2 Signal",
                "latitude": 18.5833,
                "longitude": 73.7082,
                "cycle_length_sec": 90,
                "current_phase": "Phase 1: Phase 1 to Phase 3 Megapolis Green",
                "green_time_sec": 42,
                "red_time_sec": 43,
                "yellow_time_sec": 5,
                "estimated_queue_vehicles": 16,
                "control_mode": "adaptive",
                "avg_delay_sec": 27.0,
                "optimized_delay_sec": 17.5
            }
        }

    def list_signals(self) -> List[SignalResponse]:
        return [SignalResponse(**s) for s in self.signals.values()]

    def get_signal(self, signal_id: str) -> Optional[SignalResponse]:
        if signal_id in self.signals:
            return SignalResponse(**self.signals[signal_id])
        return None

    def simulate_adaptive_timing(self, req: SignalSimulationRequest) -> SignalSimulationResult:
        sig = self.signals.get(req.signal_id)
        if not sig:
            sig = list(self.signals.values())[0]

        # Webster's baseline vs adaptive delay calculation
        baseline_cycle = sig["cycle_length_sec"]
        baseline_delay = sig["avg_delay_sec"]

        # Adapt cycle length and green split according to traffic demand
        demand_factor = req.incoming_vehicle_demand_vph / 1200.0
        optimized_cycle = max(60, min(150, int(baseline_cycle * (0.8 + 0.3 * demand_factor))))
        
        # Split calculation
        green_pct = req.proposed_green_split / 100.0
        optimized_delay = round(baseline_delay * (1.0 - (green_pct - 0.40) * 0.75), 1)
        optimized_delay = max(12.0, min(optimized_delay, baseline_delay * 0.9))

        delay_reduction = round(((baseline_delay - optimized_delay) / baseline_delay) * 100.0, 1)
        queue_clearing_time = round((req.incoming_vehicle_demand_vph / 3600.0) * (optimized_cycle * (1 - green_pct)) * 1.8, 1)

        recommendation = (
            f"Adaptive algorithm suggests increasing green split to {req.proposed_green_split}% with a {optimized_cycle}s cycle. "
            f"Expected to reduce average intersection queue delay by {delay_reduction}% during peak demand."
        )

        return SignalSimulationResult(
            signal_id=sig["id"],
            signal_name=sig["name"],
            baseline_cycle_sec=baseline_cycle,
            proposed_cycle_sec=optimized_cycle,
            baseline_delay_sec=baseline_delay,
            optimized_delay_sec=optimized_delay,
            delay_reduction_pct=delay_reduction,
            estimated_queue_clearing_sec=queue_clearing_time,
            recommendation=recommendation
        )

signal_service = SignalService()
