import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.v1.auth import router as auth_router, get_or_create_default_users
from backend.app.api.v1.map import router as map_router
from backend.app.api.v1.routing import router as routing_router
from backend.app.api.v1.incidents import router as incidents_router
from backend.app.api.v1.signals import router as signals_router
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.simulation import router as simulation_router
from backend.app.api.v1.ws import router as ws_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("smart_traffic_system")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smart City Traffic Optimization System database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        get_or_create_default_users(db)
        logger.info("Database initialized and demo role credentials verified.")
    finally:
        db.close()
    yield
    logger.info("Shutting down Smart City Traffic Optimization System.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent traffic route optimization, incident response, and signal management platform for Pune Hinjawadi Smart City.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(map_router, prefix=settings.API_V1_PREFIX)
app.include_router(routing_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(signals_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "city": settings.DEFAULT_CITY,
        "area": settings.DEFAULT_AREA,
        "docs_url": "/docs",
        "simulation_mode": True
    }

@app.get("/health")
@app.get("/api/v1/system/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "graph_nodes": 21,
        "graph_corridor": "Hinjawadi IT Corridor, Pune",
        "environment": settings.ENV,
        "simulation_active": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
