import os
from pydantic_settings import BaseSettings
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart City Traffic Route Optimization & Management System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Environment & Security
    ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart-city-pune-hinjawadi-traffic-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./traffic_system.db")
    
    # Geographic Focus: Hinjawadi, Pune, India
    DEFAULT_CITY: str = "Pune, Maharashtra, India"
    DEFAULT_AREA: str = "Hinjawadi, Pune"
    DEFAULT_LATITUDE: float = 18.5913
    DEFAULT_LONGITUDE: float = 73.7389
    DEFAULT_ZOOM: int = 13
    TIMEZONE: str = "Asia/Kolkata"
    
    # Simulation & Routing Defaults
    SIMULATION_MODE: bool = True
    DATA_FRESHNESS_TTL_SECONDS: int = 120
    MAX_SEARCH_RADIUS_KM: float = 25.0
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
