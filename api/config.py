"""Configuration management for Customer360 API."""

from functools import lru_cache
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project metadata
    PROJECT_NAME: str = "Customer360"
    VERSION: str = "0.1.0"
    SUBTITLE: str = "AI-Powered Customer Intelligence & Retention Platform"
    TAGLINE: str = "Understand customers. Predict churn. Protect revenue."
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # API Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://localhost:3000"]

    # Database Settings
    POSTGRES_USER: str = "customer360_user"
    POSTGRES_PASSWORD: str = "customer360_secure_password"
    POSTGRES_DB: str = "customer360_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = (
        "postgresql://customer360_user:customer360_secure_password@localhost:5432/customer360_db"
    )

    # DuckDB Analytics Storage
    DUCKDB_PATH: str = "data/processed/customer360.duckdb"


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
