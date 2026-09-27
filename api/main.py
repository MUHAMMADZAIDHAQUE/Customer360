"""Customer360 FastAPI Application Entrypoint.

AI-Powered Customer Intelligence & Retention Platform.
"""

from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.SUBTITLE} - {settings.TAGLINE}",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware for Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description="Returns the operational health status of the Customer360 API.",
    tags=["System"],
)
async def health_check() -> Dict[str, str]:
    """Health check endpoint returning status ok."""
    return {"status": "ok"}


@app.get(
    "/",
    summary="Root API info",
    description="Provides basic metadata about Customer360 API.",
    tags=["System"],
)
async def root() -> Dict[str, str]:
    """Root info endpoint."""
    return {
        "name": settings.PROJECT_NAME,
        "subtitle": settings.SUBTITLE,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get(
    "/analytics/tables",
    summary="List Data Foundation Tables",
    description="Returns record counts and storage metadata for Phase 1 parquet datasets.",
    tags=["Data Foundation"],
)
async def list_tables():
    """Return record counts and file sizes for all data foundation tables."""
    import os
    import pandas as pd

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_dir = os.path.join(base_dir, "data", "processed")
    tables = [
        "plans", "customers", "subscriptions", "transactions",
        "payments", "support_tickets", "customer_engagement",
        "product_usage", "churn_events"
    ]
    summary = []
    for table in tables:
        pq_path = os.path.join(processed_dir, f"{table}.parquet")
        if os.path.exists(pq_path):
            df = pd.read_parquet(pq_path)
            size_kb = round(os.path.getsize(pq_path) / 1024, 1)
            summary.append({
                "table": table,
                "record_count": len(df),
                "columns": len(df.columns),
                "size_kb": size_kb,
                "format": "parquet"
            })
    return {"tables": summary, "total_entities": len(summary)}


@app.get(
    "/analytics/quality",
    summary="Data Quality Summary",
    description="Returns aggregate quality pass rate and rule verification.",
    tags=["Data Foundation"],
)
async def get_quality_summary():
    """Return summary of data quality rule validations."""
    from analytics.data_quality import DataQualityValidator

    validator = DataQualityValidator()
    validator.load_data()
    validator.validate_duplicate_ids()
    validator.validate_null_required_fields()
    validator.validate_dates()
    validator.validate_foreign_keys()
    validator.validate_amounts()
    validator.validate_customer_states()
    validator.validate_duplicate_transactions()

    total_rules = len(validator.results)
    passed_rules = sum(1 for r in validator.results if r["status"] == "PASSED")

    return {
        "status": "PASSED" if passed_rules == total_rules else "FAILED",
        "total_rules": total_rules,
        "passed_rules": passed_rules,
        "score_pct": 100.0 if total_rules == 0 else round((passed_rules / total_rules) * 100, 1),
        "checks": validator.results[:10]  # sample of checks
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
    )
