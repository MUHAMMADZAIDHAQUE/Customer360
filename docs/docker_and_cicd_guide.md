# Customer360 - Docker Containerization & CI/CD Pipeline Guide

**Version**: 1.0.0  
**Phase**: Phase 10 (Containerization & CI/CD Observability)  
**System**: Customer360 Enterprise Analytics & Retention Platform  

---

## 1. System Containerization Architecture

Customer360 is fully containerized into a multi-service architecture orchestrated via **Docker Compose**. The production configuration isolates concerns across three dedicated container tiers connected over an isolated bridge network:

```
                                 [ Host Browser ]
                                        │
                         ┌──────────────┴──────────────┐
                         │  Port 3000                  │ Port 8000
                         ▼                             ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │  customer360_       │       │  customer360_       │
              │  frontend           │       │  api                │
              │  (Nginx 1.25 SPA)   │──────▶│  (FastAPI Backend)  │
              └─────────────────────┘       └──────────┬──────────┘
                                                       │ Port 5432
                                                       ▼
                                            ┌─────────────────────┐
                                            │  customer360_       │
                                            │  postgres           │
                                            │  (PostgreSQL 16)    │
                                            └──────────┬──────────┘
                                                       ▼
                                            [ postgres_data Volume ]
```

### Container Services Summary

| Container Name | Base Image | Internal Port | Host Port | Role & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| `customer360_postgres` | `postgres:16-alpine` | `5432` | `5432` | Relational data warehouse. Automatically initializes schema DDL and performance indexes from `/docker-entrypoint-initdb.d/`. |
| `customer360_api` | `python:3.11-slim` | `8000` | `8000` | FastAPI backend application server, DuckDB analytics engine, ML inference pipeline, and AI Analyst agent. |
| `customer360_frontend` | `nginx:1.25-alpine` | `80` | `3000` | Multi-stage production build of React 18 + Vite SPA, served with gzip compression, SPA client routing fallback, and `/api/` reverse proxy. |

---

## 2. One-Command Local Docker Setup

### 2.1 Quickstart
To build and launch the entire Customer360 application stack in one command:

```bash
# 1. Initialize environment configuration
cp .env.example .env

# 2. Build and launch all container services
docker compose up --build
```

Once running, access the services:
* 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
* 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
* 📖 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* 🛡️ **Data Quality Dashboard**: [http://localhost:3000/quality](http://localhost:3000/quality)
* 🐘 **PostgreSQL Instance**: `localhost:5432` (`customer360_db`)

### 2.2 Managing Containers
```bash
# Run in background (detached mode)
docker compose up -d

# View real-time logs across all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f api

# Stop all containers gracefully
docker compose down

# Stop and wipe persistent PostgreSQL database volume
docker compose down -v
```

---

## 3. Local Development Workflow

### 3.1 Live Hot-Reloading with Docker Compose
For active development with live code reloading in containers without rebuilding images:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This mounts local directories (`./api`, `./analytics`, `./ml`, `./data`, `./database`, `./dbt`) directly into the running container with Uvicorn hot-reloading enabled.

### 3.2 Bare-Metal Local Development
If running directly on the host machine:

```bash
# 1. Start Python Virtual Environment
source venv/bin/activate
pip install -r requirements.txt

# 2. Start Backend API Server
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

# 3. Start Frontend Dev Server (in separate terminal)
cd frontend
npm install
npm run dev
```

### 3.3 Executing Local Quality Suites

```bash
# Run complete test suite (70 tests)
pytest tests/ -v

# Run Python code linting
flake8 api analytics ml tests

# Run 105 automated data quality checks
python analytics/data_quality.py

# Run dbt data integrity tests
dbt test --project-dir dbt --profiles-dir dbt

# Run Frontend TypeScript check & build
cd frontend && npx tsc --noEmit && npm run build
```

---

## 4. GitHub Actions CI/CD Pipeline

The Customer360 CI/CD pipeline is defined in [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml). It automatically triggers on every `push` and `pull_request` to `main`, `master`, and `develop`.

```
                      [ Push or Pull Request Event ]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ python-lint  │             │frontend-check│             │backend-tests │
│   (flake8)   │             │ (tsc & build)│             │  (70 tests)  │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       ├────────────────────────────┼────────────────────────────┤
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  dbt-tests   │             │ data-quality │             │ docker-build │
│  (73 tests)  │             │ (105 checks) │             │ (multi-stage)│
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │  quality-gate       │
                         │  (PR Gatekeeper)    │
                         └─────────────────────┘
```

### 4.1 Pipeline Jobs Matrix

| Job Name | Target Scope | Tools / Commands | Failure Criteria |
| :--- | :--- | :--- | :--- |
| **`python-lint`** | Python syntax, PEP8, import hygiene | `flake8 api analytics ml tests` | Unused variables, unresolved imports, syntax violations. |
| **`frontend-checks`** | TypeScript types & Vite production bundle | `npm ci`, `npx tsc --noEmit`, `npm run build` | Type errors, missing React props, build bundling failures. |
| **`backend-tests`** | Backend routers, ML inference, AI Analyst, data pipelines | `pytest tests/ -v` | Any assertion failure across 70 tests. |
| **`dbt-tests`** | Staging, intermediate, and analytical marts data models | `dbt test --project-dir dbt --profiles-dir dbt` | Schema contract violations, orphan relationships, nulls in PKs (73 checks). |
| **`data-quality-tests`**| Comprehensive dataset observability & integrity | `python analytics/data_quality.py` | Any failure across the 105 automated checks (<100% score). |
| **`docker-build`** | Multi-stage Docker image packaging | `docker/build-push-action@v5` | Dockerfile compilation or dependency resolution errors. |
| **`quality-gate`** | Unified PR Gatekeeper status check | Upstream aggregation | Fails if **any** upstream job fails. |

---

## 5. Security & GitHub Secrets Management

**Zero secrets are stored in source code or committed to GitHub repositories.**

### Configured Secrets & Environment Variables

| Variable / Secret | Source | Purpose | Recommended Default / Setting |
| :--- | :--- | :--- | :--- |
| `POSTGRES_USER` | `.env` / Secret | PostgreSQL username | `customer360_user` |
| `POSTGRES_PASSWORD` | `.env` / Secret | PostgreSQL password | Strong random secret |
| `POSTGRES_DB` | `.env` / Secret | Target database name | `customer360_db` |
| `DATABASE_URL` | `.env` / Secret | Database connection string | `postgresql://...` |
| `OPENAI_API_KEY` | GitHub Secret | OpenAI API Key for AI Analyst (optional) | User-supplied key |
| `SLACK_WEBHOOK_URL` | GitHub Secret | Outgoing alert notifications (optional) | Slack App Webhook |
| `PAGERDUTY_ROUTING_KEY`| GitHub Secret | Critical incident paging (optional) | PagerDuty Integration Key |

---

## 6. Environment Variables Reference

A complete `.env` file should contain the following settings:

```ini
# ==============================================================================
# Customer360 Environment Configuration
# ==============================================================================

# Application Environment
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

# Backend API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000

# Frontend Configuration
VITE_API_URL=http://localhost:8000

# PostgreSQL Database Configuration
POSTGRES_USER=customer360_user
POSTGRES_PASSWORD=customer360_secure_password
POSTGRES_DB=customer360_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://customer360_user:customer360_secure_password@postgres:5432/customer360_db

# DuckDB Analytics Storage
DUCKDB_PATH=data/processed/customer360.duckdb

# Alerting & Incident Observability (Optional)
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
# PAGERDUTY_ROUTING_KEY=...

# AI Analyst LLM Integration (Optional)
# OPENAI_API_KEY=sk-...
# MODEL_NAME=gpt-4o
```
