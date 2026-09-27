# ==============================================================================
# Customer360 Backend FastAPI Container
# AI-Powered Customer Intelligence & Retention Platform
# ==============================================================================

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install minimal OS runtime dependencies and curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
COPY api/requirements.txt ./api/
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy application layers
COPY api/ ./api/
COPY analytics/ ./analytics/
COPY ml/ ./ml/
COPY data/ ./data/
COPY database/ ./database/
COPY dbt/ ./dbt/

# Create a non-root application user for production security
RUN useradd -u 1001 -m appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Container Health Check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
