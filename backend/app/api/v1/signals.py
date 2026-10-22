from fastapi import APIRouter, HTTPException
from typing import List
from backend.app.services.signal_service import signal_service
from backend.app.schemas.signal import SignalResponse, SignalSimulationRequest, SignalSimulationResult

router = APIRouter(prefix="/signals", tags=["Smart Traffic Signals"])

@router.get("", response_model=List[SignalResponse])
def get_traffic_signals():
    return signal_service.list_signals()

@router.get("/{signal_id}", response_model=SignalResponse)
def get_signal_details(signal_id: str):
    sig = signal_service.get_signal(signal_id)
    if not sig:
        raise HTTPException(status_code=404, detail="Signal not found")
    return sig

@router.post("/simulate-adaptive", response_model=SignalSimulationResult)
def run_adaptive_signal_simulation(req: SignalSimulationRequest):
    return signal_service.simulate_adaptive_timing(req)
