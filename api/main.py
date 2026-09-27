"""
Customer360 FastAPI Application Entrypoint
===========================================
Production-ready REST API for AI-Powered Customer Intelligence & Retention.
"""

import time
from typing import Dict
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.config import get_settings
from api.logging_config import setup_logging
from api.routers import (
    health,
    customers,
    metrics,
    churn,
    segments,
    cohorts,
    revenue,
    predictions,
    quality,
    analyst
)

settings = get_settings()
logger = setup_logging(
    log_level=settings.LOG_LEVEL,
    json_logs=(settings.ENVIRONMENT == "production")
)

tags_metadata = [
    {"name": "System", "description": "Core application health and runtime diagnostics."},
    {"name": "Customers", "description": "360-degree customer directory, filtering, sorting, and profiles."},
    {"name": "Metrics", "description": "Authoritative executive business KPIs and run-rate analytics."},
    {"name": "Churn Analytics", "description": "Multidimensional attrition analysis across tenure, contracts, and tiers."},
    {"name": "Customer Segments", "description": "RFM quantitative behavioral segmentation and action playbooks."},
    {"name": "Cohort Analysis", "description": "Signup-month triangular customer retention matrices."},
    {"name": "Revenue Analytics", "description": "Recurring revenue distributions and at-risk ARR exposure audits."},
    {"name": "ML Predictions", "description": "Real-time machine learning inference and SHAP explainability."},
    {"name": "Data Quality", "description": "Automated data hygiene scorecard and integrity validations."},
    {"name": "AI Analyst", "description": "Grounded natural-language customer intelligence copilot."}
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# Customer360 REST API

### AI-Powered Customer Intelligence & Retention Platform

Welcome to the **Customer360** production API. This service exposes:
* **Customer 360 Profiles:** Unified customer dimensions across behavioral, financial, and support history.
* **Canonical SaaS Metrics:** Authoritative definitions for MRR, ARR, ARPU, Churn Rate, and CLV.
* **Churn & Cohort Analytics:** Multidimensional risk analysis, retention curves, and RFM behavioral clustering.
* **Real-Time Machine Learning:** Low-latency churn probability scoring powered by trained ensemble models with local SHAP feature attribution.
* **Data Quality Monitoring:** Continuous rule-based integrity testing and schema validation.
    """,
    version=settings.VERSION,
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Request Logging & Tracing Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Logs incoming HTTP requests and latency for observability."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    if request.url.path != "/health":
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)"
        )
    return response


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Enforces enterprise security headers across all API responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Global Structured Error Handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"])
        errors.append({
            "field": field,
            "message": err["msg"]
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request payload or query parameters failed validation.",
            "status_code": 422,
            "details": errors,
            "path": str(request.url.path)
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred while processing the request.",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )


# Mount All API Routers
app.include_router(health.router)
app.include_router(customers.router)
app.include_router(metrics.router)
app.include_router(churn.router)
app.include_router(segments.router)
app.include_router(cohorts.router)
app.include_router(revenue.router)
app.include_router(predictions.router)
app.include_router(quality.router)
app.include_router(analyst.router)


@app.get("/", summary="Root Info", tags=["System"])
async def root() -> Dict[str, str]:
    return {
        "name": settings.PROJECT_NAME,
        "subtitle": settings.SUBTITLE,
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
