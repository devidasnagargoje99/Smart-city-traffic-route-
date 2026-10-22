# Smart City Traffic Route Optimization & Intelligent Management System
### Urban Mobility Command Center — Focused on Hinjawadi, Pune, Maharashtra, India

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_TypeScript-61DAFB.svg?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Map-Leaflet_GIS-199900.svg?logo=leaflet)](https://leafletjs.com)
[![Python](https://img.shields.io/badge/Python-3.12%2B_Compatible-blue.svg?logo=python)](https://python.org)
[![NetworkX](https://img.shields.io/badge/Graph-NetworkX_Routing-orange.svg)](https://networkx.org)
[![Scikit-Learn](https://img.shields.io/badge/AI-Scikit--Learn_Ridge-F7931E.svg?logo=scikit-learn)](https://scikit-learn.org)

---

## 1. Role and Objective

The **Smart City Traffic Route Optimization and Intelligent Traffic Management System** is a full-stack, GIS-enabled urban mobility management platform. Engineered specifically for the IT corridor of **Hinjawadi (Rajiv Gandhi Infotech Park), Pune, Maharashtra, India**, the application enables urban authorities, traffic police operators, commuters, and emergency services to monitor congestion, optimize travel routes, manage road closures, adapt signal timings, and evaluate traffic performance.

---

## 2. Key Features

- **Interactive Leaflet GIS Map:**
  - Centered on Hinjawadi (`18.5913° N, 73.7389° E`).
  - OpenStreetMap / CARTO tile layer integration with attribution.
  - Color-coded road congestion overlays (Green, Yellow, Orange, Red, Closed).
  - Node markers for signalized and un-signalized intersections.
  - Verified incident markers with severity indicators.
  - Interactive click-to-set origin and destination.

- **Dynamic Route Optimization Engine:**
  - Real graph algorithms: **Dijkstra** and **A\*** with an admissible straight-line distance lower-bound heuristic.
  - Multiple routing objectives:
    - **Shortest Distance:** Minimizes physical kilometers.
    - **Fastest Time:** Minimizes arrival duration based on current road speeds.
    - **Congestion-Aware (Recommended):** Bypasses severe chokepoints using dynamic generalized cost.
    - **Emergency Priority:** Prioritizes response vehicles, applies clearance speeds, and strictly routes around confirmed blockades.
  - Candidate route diversification for alternative corridor analysis (e.g., Marunji/Punawale bypass vs NH48).
  - Transparent calculation of **Time Savings %** and **Congestion Exposure %**.

- **Deterministic Simulation Engine:**
  - 5 pre-configured reproducible Hinjawadi demonstration scenarios:
    1. `morning_peak` (09:15): Heavy inbound IT workforce influx from Wakad & Baner into Phase 1, 2, and 3.
    2. `evening_peak` (18:45): Outbound traffic from Megapolis Phase 3 towards the highway.
    3. `monsoon_waterlogging` (19:30): Severe slowdowns at Bhumkar underpass and Shivaji Chowk.
    4. `road_closure_incident` (10:00): Tanker breakdown blocking the Shivaji Gateway, automatically triggering northern bypass rerouting.
    5. `off_peak` (14:00): Free-flow daytime conditions.

- **Incident & Road Restriction Lifecycle:**
  - Status progression: `Reported` $\to$ `Under Review` $\to$ `Verified` $\to$ `Resolved`.
  - Operator verification immediately updates edge delay penalties or blocks passage in the road graph.

- **Smart Traffic Signal Management:**
  - Signal status for major chowks (Shivaji Chowk, Bhumkar Chowk, Dange Chowk, Infosys Circle, Wipro Circle).
  - Webster adaptive delay simulation comparing baseline fixed timings vs demand-responsive green phase splits.

- **AI-Based Traffic Forecasting (Scikit-Learn):**
  - Linear/Ridge regression model trained with chronological train/test splits.
  - Benchmarked against a historical hour-category baseline with transparent MAE and RMSE metrics.

- **Role-Based Access Control:**
  - Dedicated access profiles: **Administrator**, **Traffic Operator**, **Commuter**, and **108 Emergency Services**.

---

## 3. High-Level Architecture

```mermaid
flowchart TD
    subgraph Data Sources & Simulation
        SIM[Deterministic Simulation Engine\n(Peak Hours, Weather, Blockades)]
        EXT[OSM Hinjawadi Road Topology]
    end

    subgraph Backend Core (FastAPI + Python)
        GRAPH[NetworkX Directed Multigraph]
        ROUTER[Dynamic Route Optimizer\n(A*, Dijkstra, Yen's K-Paths)]
        INC_MGR[Incident Lifecycle Manager]
        PRED_SVC[Scikit-Learn AI Predictor]
        SIG_SVC[Webster Adaptive Signal Engine]
        AUTH[JWT Role Authorization]
    end

    subgraph Database
        DB[(SQLite / PostgreSQL + PostGIS)]
    end

    subgraph Frontend Client (React 18 + TS + Leaflet)
        MAP[Interactive Traffic Map]
        PLANNER[Multi-Objective Route Planner]
        INC_UI[Incident Workspace]
        SIG_UI[Smart Signals Console]
        ANALYTICS[Recharts Performance Dashboard]
    end

    SIM --> GRAPH
    EXT --> GRAPH
    GRAPH --> ROUTER
    INC_MGR --> GRAPH
    ROUTER --> DB
    AUTH --> DB

    ROUTER <--> PLANNER
    GRAPH <--> MAP
    INC_MGR <--> INC_UI
    SIG_SVC <--> SIG_UI
    PRED_SVC <--> ANALYTICS
```

---

## 4. Quick Start Guide

### Step 1: Clone & Navigate
```bash
cd Scratch
```

### Step 2: Start the Backend Server
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### Step 3: Start the Frontend Application
In a separate terminal window:
```bash
cd frontend

# Install npm packages
npm install

# Launch Vite dev server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 5. Docker Deployment

Deploy the entire stack with Docker Compose:
```bash
docker compose up --build
```

---

## 6. Automated Testing Verification

All unit, algorithm, API, and frontend tests are fully implemented and verified:

```bash
# Run backend pytest suite (12 tests)
python -m pytest backend/app/tests -v

# Run frontend vitest suite (4 tests)
cd frontend && npm test

# Verify production frontend build
npm run build
```

---

## 7. Project Structure

```
smart-city-traffic-optimization/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints (auth, map, routes, incidents, signals, analytics)
│   │   ├── core/            # Configuration, database, security
│   │   ├── data/            # Hinjawadi road network JSON dataset
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Routing engine, graph service, incident manager, AI prediction
│   │   ├── tests/           # Pytest test suite
│   │   └── main.py          # FastAPI application entry
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, Sidebar, ScenarioController
│   │   ├── features/map/    # Leaflet interactive traffic map
│   │   ├── pages/           # Dashboard, Live Map, Route Planner, Emergency, Incidents, Signals, Analytics, Settings
│   │   ├── services/        # Typed API service
│   │   ├── types/           # TypeScript definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── setup.md
│   ├── testing.md
│   └── limitations.md
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 8. License & Attribution

- Base map tiles &copy; [CARTO](https://carto.com) Voyager.
- Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL).
