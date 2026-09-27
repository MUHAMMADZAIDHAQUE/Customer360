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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
    )
