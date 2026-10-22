# Testing Documentation & Verification Suite

## Test Coverage Overview

Automated tests are divided into algorithm benchmarks, integration tests, and frontend logic tests.

---

### 1. Routing Engine Tests (`backend/app/tests/test_algorithms.py`)

- **`test_haversine_distance`**: Verifies accurate geodesic distance math between Hinjawadi junctions (Shivaji Chowk to Bhumkar Chowk).
- **`test_dijkstra_and_astar_consistency`**: Verifies that both Dijkstra's algorithm and A* converge on optimal paths with identical endpoints.
- **`test_road_closure_rerouting`**: Closes primary Hinjawadi gateway segment (`seg_wakad_bridge_shivaji`) and verifies that the routing engine automatically re-routes traffic around the closure.
- **`test_emergency_priority_routing`**: Evaluates the emergency response profile, ensuring speed priority factors are applied while strictly respecting physical closures.
- **`test_alternative_paths_diversity`**: Confirms that candidate route generator returns diverse corridor alternatives (e.g., via Marunji bypass vs via highway).
- **`test_admissible_heuristic`**: Mathematically checks that $h(u, v) \le \text{true\_cost}(u, v)$ for all nodes, preserving A* optimality.

---

### 2. Backend API Integration Tests (`backend/app/tests/test_api.py`)

- **`test_root_and_health`**: Verifies `/` and `/api/v1/system/health` status codes and data contracts.
- **`test_map_endpoints`**: Confirms road nodes, road segments, and network summary endpoints return valid geographic entities.
- **`test_routing_optimization_and_compare`**: Tests `/routes/optimize` and `/routes/compare` for origin-destination queries.
- **`test_incident_lifecycle`**: Tests reporting $\to$ verifying $\to$ resolving an incident and confirms dynamic road graph updates.
- **`test_signals_and_simulation`**: Validates smart traffic signal data and Webster adaptive simulation.
- **`test_analytics_and_ai_model`**: Evaluates AI prediction report and MAE metrics.

---

### 3. Frontend Tests (`frontend/src/tests/app.test.ts`)

- **Node Data Modeling**: Validates coordinates and naming structure for Hinjawadi network nodes.
- **Time Savings Percent Calculation**: Validates formula `((baseline - optimized) / baseline) * 100`.
- **Congestion Color Assignment**: Verifies mapping from low, moderate, heavy, severe, and closed states to color hex values.
- **Simulation Scenario Matrix**: Tests scenario definitions and parameters.

---

### 4. Running the Tests

To run backend tests:
```bash
python -m pytest backend/app/tests -v
```

To run frontend tests:
```bash
cd frontend && npm test
```
