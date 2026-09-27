"""
Customer360 Health Router
=========================
System health check and diagnostic inspection.
"""

import os
from fastapi import APIRouter
from pydantic import BaseModel
from api.database import analytics_service

router = APIRouter(tags=["System"])


class HealthStatus(BaseModel):
    status: str
    database: str
    model_loaded: bool
    version: str


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="API Health Status",
    description="Returns operational health status of API service, analytical database, and ML engine."
)
async def get_health():
    # Verify DuckDB database connection
    db_ok = True
    try:
        analytics_service.query_one("SELECT 1;")
    except Exception:
        db_ok = False

    # Check if ML champion model exists
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(base_dir, "ml", "artifacts", "best_churn_model.joblib")
    model_ok = os.path.exists(model_path)

    return HealthStatus(
        status="ok" if db_ok else "degraded",
        database="connected" if db_ok else "unavailable",
        model_loaded=model_ok,
        version="1.0.0"
    )
