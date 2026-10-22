# Known Limitations & Future Roadmap

## Real-World Considerations & Transparent Disclosures

### 1. Simulated vs Live Observations
- This system is currently configured in **SIMULATION MODE** using a deterministic, high-fidelity model of Hinjawadi (Rajiv Gandhi Infotech Park), Pune.
- No live traffic camera, in-pavement inductive loop, or physical GPS probe feed is fabricated.
- External data sources (such as TomTom, Google Traffic, or PMRDA ATMS feeds) can be integrated by implementing the provider interface in `backend/app/services/traffic_service.py`.

### 2. Physical Traffic Controller Commands
- The Smart Traffic Signal module evaluates and simulates Webster adaptive timings.
- In production, real SCATS / SCOOT / ITMS controller integrations require safety-certified fail-safes and manual operator authorization before timing plan execution.

### 3. SUMO Simulation Integration
- Microscopic simulation through Eclipse SUMO (Simulation of Urban MObility) can be connected via TraCI (Traffic Control Interface) for vehicle-level lane-changing and car-following experiments.

### 4. Database Scaling
- For local development and demonstration, the application runs out-of-the-box on SQLite without requiring external database installation.
- For high-throughput production, configure PostgreSQL with the PostGIS extension by setting `DATABASE_URL=postgresql+psycopg2://...` in `.env`.
