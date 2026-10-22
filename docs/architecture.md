# Architecture Documentation

## Smart City Traffic Route Optimization & Management System
**Geographic Target:** Hinjawadi (Rajiv Gandhi Infotech Park), Pune, Maharashtra, India

---

### 1. Architectural Layers

1. **Client / Presentation Layer (React 18 + TypeScript + Vite + Leaflet + Tailwind CSS)**
   - Interactive OpenStreetMap-based GIS map centered on Hinjawadi (`18.5913° N, 73.7389° E`).
   - Dynamic polyline color-coding reflecting road congestion:
     - **Green:** Low congestion ($> 75\%$ free-flow speed)
     - **Yellow:** Moderate congestion ($50\% - 75\%$ free-flow speed)
     - **Orange:** Heavy congestion ($25\% - 50\%$ free-flow speed)
     - **Red:** Severe congestion ($< 25\%$ free-flow speed)
     - **Dashed Gray:** Physically closed or blocked road segment
   - Multi-role support with dynamic consoles:
     - **Administrator:** System settings, role governance, audit logs.
     - **Traffic Operator:** Incident verification, delay overrides, road closures.
     - **Commuter:** Origin-Destination comparison, time savings, congestion avoidance.
     - **Emergency Services (108):** Priority corridor solver, ambulance hospital dispatch.

2. **API & Real-Time Gateway (FastAPI + WebSockets)**
   - Versioned REST APIs under `/api/v1/...`.
   - Pydantic v2 data validation and strict schema enforcement.
   - Structured JSON response models with latency logging.
   - Real-time WebSocket channel `/ws/traffic` broadcasting traffic state ticks.

3. **Road Graph & Routing Engine (NetworkX + Dijkstra + A*)**
   - High-fidelity directed multigraph capturing Hinjawadi Phase 1, Phase 2, Phase 3, Wakad, Bhumkar Chowk, Dange Chowk, and NH48 Expressway.
   - Haversine trigonometric distance calculation for geographic coordinates.
   - Goal-directed A* search with strictly admissible lower-bound heuristic:
     $$h(u, v) = \frac{\text{haversine\_distance}(u, v)}{v_{\max}}$$
     Where $v_{\max} = 80 \text{ km/h} = 22.22 \text{ m/s}$.
   - Cost Function formulation:
     $$\text{cost}(e) = \text{travel\_time}(e) \times (1 + \text{penalty}_{\text{congestion}}(e)) + \text{delay}_{\text{incident}}(e) + \text{penalty}_{\text{risk}}(e)$$
   - Penalty-based candidate route diversification (generating multiple viable alternative corridors like the Marunji/Punawale bypass vs NH48).

4. **Incident & Road Restriction Lifecycle**
   - Workflow: `Reported` $\to$ `Under Review` $\to$ `Verified` $\to$ `Resolved`.
   - Verified incidents apply delay penalties or absolute edge traversability blockades ($w = \infty$).
   - Dynamically re-routes active journeys around closed bridges or bottlenecks.

5. **AI / Machine Learning Traffic Prediction Module (Scikit-Learn)**
   - Chronological train/validation/test split avoiding temporal lookahead leakage.
   - Features: `hour`, `day_of_week`, `is_weekend`, `category_code`, `distance_m`, `prev_hour_speed`.
   - Evaluated against historical hour-category baseline averages with MAE and RMSE metrics.

6. **Adaptive Traffic Signal Module (Webster's Delay Formulation)**
   - Evaluates intersection delay before and after demand-responsive green phase splits.
   - Demonstrates measurable intersection queue reduction under peak demand.
