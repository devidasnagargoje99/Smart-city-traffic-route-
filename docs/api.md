# REST & WebSocket API Specification

Base URL: `http://localhost:8000/api/v1`  
Interactive Swagger Docs: `http://localhost:8000/docs`  
Interactive Redoc: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints

### `POST /auth/login`
- **Description:** OAuth2 compliant user login. Returns JWT bearer token.
- **Form Data:** `username` (email), `password`
- **Response:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "operator@smarttraffic.pune.gov.in",
  "role": "operator",
  "full_name": "Hinjawadi Control Room Operator"
}
```

### `POST /auth/register`
- **Description:** Register a new user with role assignment.

### `GET /auth/me`
- **Description:** Get active authenticated user details.

---

## 2. Interactive Map & Network Endpoints

### `GET /map/summary`
- **Description:** Returns high-level city network statistics.
- **Response:**
```json
{
  "total_nodes": 21,
  "total_segments": 27,
  "active_incidents": 2,
  "congested_segments": 3,
  "average_network_speed_kmh": 41.2,
  "data_freshness_sec": 4,
  "mode": "SIMULATION MODE",
  "city": "Pune, Maharashtra, India",
  "area": "Hinjawadi IT Corridor"
}
```

### `GET /map/nodes`
- **Description:** Returns all road network junctions and intersections.

### `GET /map/roads`
- **Description:** Returns all road segments with geometry and congestion levels.

---

## 3. Route Optimization Endpoints

### `POST /routes/optimize`
- **Description:** Calculate the optimal route between origin and destination.
- **Request Body:**
```json
{
  "origin_id": "wakad_flyover",
  "destination_id": "megapolis_ph3",
  "objective": "congestion_aware",
  "user_role": "commuter"
}
```
- **Response:**
```json
{
  "route_id": "rt_98b1c4e2",
  "objective": "congestion_aware",
  "objective_label": "Congestion-Optimized (Recommended)",
  "total_distance_km": 8.7,
  "estimated_travel_time_minutes": 17.5,
  "baseline_travel_time_minutes": 24.0,
  "estimated_time_savings_pct": 27.1,
  "congestion_exposure_pct": 14.5,
  "node_sequence": ["wakad_flyover", "bhumkar_chowk", "suratwala_chowk", "..."],
  "ordered_coordinates": [[18.5925, 73.7634], [18.5982, 73.7548], ...],
  "segments": [...],
  "computation_latency_ms": 3.8
}
```

### `POST /routes/compare`
- **Description:** Returns multi-objective comparison (Shortest Distance, Fastest Route, Congestion-Aware, Emergency Priority).

---

## 4. Incident Management Endpoints

### `GET /incidents`
- **Query Params:** `status` (`reported`, `under_review`, `verified`, `resolved`)

### `POST /incidents`
- **Description:** Report a new traffic incident or road closure.

### `PATCH /incidents/{incident_id}`
- **Description:** Update incident status, severity, or delay penalty.

### `POST /incidents/{incident_id}/resolve`
- **Description:** Resolve incident and remove road graph restrictions.

---

## 5. Traffic Signals Endpoints

### `GET /signals`
- **Description:** List all signalized intersections.

### `POST /signals/simulate-adaptive`
- **Description:** Run Webster delay formula simulation for proposed green split.

---

## 6. Simulation Controller Endpoints

### `GET /simulation/scenarios`
- **Description:** List available reproducible demonstration scenarios.

### `POST /simulation/scenario`
- **Description:** Apply a simulation scenario (`morning_peak`, `evening_peak`, `monsoon_waterlogging`, `road_closure_incident`, `off_peak`).

---

## 7. WebSockets

### `ws://localhost:8000/ws/traffic`
- **Description:** Real-time push channel delivering traffic speed updates, clock ticks, and incident alerts every 4 seconds.
