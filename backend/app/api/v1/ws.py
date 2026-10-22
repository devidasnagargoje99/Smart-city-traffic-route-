import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
from backend.app.services.traffic_service import traffic_service
from backend.app.services.simulation_service import simulation_service

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/traffic")
async def websocket_traffic_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send periodic snapshot every 4 seconds
            summary = traffic_service.get_network_summary()
            scenario = simulation_service.get_current_scenario()
            data = {
                "type": "traffic_tick",
                "simulated_clock": simulation_service.simulated_clock,
                "scenario": scenario.name,
                "average_speed_kmh": summary.average_network_speed_kmh,
                "congested_segments": summary.congested_segments,
                "active_incidents": summary.active_incidents,
                "freshness_sec": summary.data_freshness_sec
            }
            await websocket.send_json(data)
            await asyncio.sleep(4)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
