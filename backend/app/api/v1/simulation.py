from fastapi import APIRouter
from typing import List
from backend.app.services.simulation_service import simulation_service
from backend.app.schemas.simulation import SimulationScenario, ScenarioUpdateRequest

router = APIRouter(prefix="/simulation", tags=["Simulation Controller"])

@router.get("/scenarios", response_model=List[SimulationScenario])
def get_simulation_scenarios():
    return simulation_service.list_scenarios()

@router.get("/current")
def get_current_simulation_state():
    scenario = simulation_service.get_current_scenario()
    return {
        "active_scenario": scenario,
        "simulated_clock": simulation_service.simulated_clock,
        "is_simulation_mode": True,
        "city": "Pune, Maharashtra, India",
        "corridor": "Hinjawadi Rajiv Gandhi Infotech Park"
    }

@router.post("/scenario", response_model=SimulationScenario)
def set_active_scenario(req: ScenarioUpdateRequest):
    return simulation_service.apply_scenario(req.scenario_id)
