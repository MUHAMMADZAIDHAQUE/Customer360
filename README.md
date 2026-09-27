# CUSTOMER360

### **AI-Powered Customer Intelligence & Retention Platform**

> *Understand customers. Predict churn. Protect revenue.*

---

## 1. Project Overview

**Customer360** is an enterprise-grade customer intelligence and retention platform designed to solve one of the most critical challenges in recurring-revenue businesses: **understanding customer behavior, predicting churn velocity before it occurs, and calculating actionable revenue-at-risk exposures.**

The platform bridges modern data engineering, analytics engineering, explainable machine learning, and executive BI into a unified, modular architecture.

### Core Capabilities Roadmap

* **Customer 360 Unified Profiles**: Ingests behavioral, transactional, and engagement events across distributed customer touchpoints into a unified dimensional model.
* **RFM & Behavioral Segmentation**: Calculates Recency, Frequency, and Monetary scores alongside cohort retention matrices.
* **Predictive Churn Engine**: Trains gradient-boosted trees (XGBoost) and scikit-learn classifiers to compute per-account churn propensity.
* **Explainable AI (SHAP)**: Translates black-box ML predictions into human-interpretable feature attributions for account managers.
* **Financial Risk & CLV**: Quantifies Customer Lifetime Value (CLV) and isolates total annual recurring revenue (ARR) currently exposed to attrition.
* **AI Copilot & Conversational Analytics**: Natural language query engine empowering non-technical stakeholders to inspect retention data.
* **Production Serving & Dashboards**: High-performance asynchronous FastAPI REST backend paired with a modern React + TypeScript dashboard and Power BI semantic models.

---

## 2. Target Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend & Data Platform** | Python 3.11, PostgreSQL 16, DuckDB, Apache Parquet, Pandas, Polars, SQL |
| **Analytics Engineering** | dbt Core, SQL models, data quality testing |
| **Machine Learning** | scikit-learn, XGBoost, SHAP (SHapley Additive exPlanations) |
| **API Serving** | FastAPI, Pydantic v2, Uvicorn, HTTPX |
| **Frontend** | React 18, TypeScript, Vite, Vanilla CSS Design System |
| **Business Intelligence** | Power BI, DAX semantic models |
| **Infrastructure & DevOps**| Docker, Docker Compose, Git, GitHub Actions CI/CD |
| **Testing & Quality** | pytest, dbt tests, API contract testing |

---

## 3. Repository Architecture

```text
customer360/
├── README.md                 # Project manifesto, architecture & setup guide
├── .gitignore                # Production ignore rules (Python, Node, DuckDB, data)
├── .env.example              # Environment variables template
├── docker-compose.yml        # Multi-container orchestration (FastAPI, React, Postgres)
├── requirements.txt          # Python root dependencies reference
├── docs/                     # Architectural specs, schema designs, and setup guides
│   └── local_setup.md
├── data/                     # Data tiers (version-controlled structure, data ignored)
│   ├── raw/                  # Source CSV/JSON telemetry drops
│   ├── processed/            # Parquet files and DuckDB database
│   └── sample/               # Minimal sample datasets
├── database/                 # PostgreSQL DDL migrations and seed scripts
├── dbt/                      # dbt analytics engineering project
├── analytics/                # Ad-hoc analytics, cohort algorithms, RFM logic
├── ml/                       # Feature engineering, XGBoost training, SHAP attribution
├── api/                      # FastAPI asynchronous microservice
│   ├── Dockerfile
│   ├── config.py             # Pydantic Settings configuration
│   ├── main.py               # Application entrypoint & /health route
│   └── requirements.txt
├── frontend/                 # React + TypeScript + Vite SaaS client
│   ├── Dockerfile            # Multi-stage production container
│   ├── nginx.conf            # Nginx SPA reverse proxy
│   ├── package.json
│   ├── vite.config.ts
│   └── src/                  # Theme engine, layout, and reactive components
├── powerbi/                  # Power BI templates (.pbit), DAX measures, data models
├── tests/                    # Backend automated pytest suite
│   └── test_health.py
└── .github/
    └── workflows/            # GitHub Actions CI pipelines
```

---

## 4. Phase 0 Status: Foundation & Scaffolding

Phase 0 establishes the engineering baseline for the platform:

* [x] **Repository Initialized**: Git version control configured with robust `.gitignore`.
* [x] **Folder Hierarchy**: Full directory structure created preserving modules for future phases.
* [x] **Environment Configuration**: `.env.example` created with zero hardcoded credentials.
* [x] **FastAPI Microservice**: Modular backend with Pydantic configuration, CORS, and `GET /health`.
* [x] **Health Endpoint Verification**: `GET /health` returns exact contract `{"status": "ok"}`.
* [x] **Frontend Foundation**: React 18 + TypeScript + Vite SaaS portal with custom design tokens.
* [x] **Theme Engine**: Dark theme as default, light theme toggle, system mode, and persistent `localStorage`.
* [x] **Sidebar Navigation**: Enterprise navigation with active Phase 0 status and upcoming module indicators.
* [x] **Docker Foundation**: `Dockerfile` for backend, multi-stage `Dockerfile` with Nginx for frontend, and `docker-compose.yml`.
* [x] **Automated Tests**: Pytest test suite validating `/health` and root API contracts.

---

## 5. Phase 1 Status: Data Foundation & Analytical Datasets

Phase 1 establishes the production-grade data foundation and realistic subscription telemetry:

* [x] **9 Core Entities**: Created `plans`, `customers`, `subscriptions`, `transactions`, `payments`, `support_tickets`, `customer_engagement`, `product_usage`, `churn_events`.
* [x] **Statistically Realistic Behavioral Distributions**:
  * Tenure and pricing tiers influence activity and ticket volume.
  * Declining engagement (sessions, duration, features) directly precedes churn.
  * Support friction (high priority, poor satisfaction) correlates with churn.
  * Contract commitments (monthly vs annual) drive distinct retention curves.
  * Involuntary churn triggered by realistic payment delinquency.
  * Zero target leakage across timestamps and events.
* [x] **PostgreSQL 16 Schema & Index Architecture**:
  * Schema DDL: `database/schema.sql` (PK, FK cascades, check constraints, default values).
  * Performance Indexes: `database/indexes.sql` on foreign keys, temporal timestamps, and lookup columns.
  * Bulk Ingestion: `database/load_data.sql` and `database/init_db.py`.
* [x] **Columnar Parquet & DuckDB OLAP Engine**:
  * Clean Snappy-compressed Parquet files stored in `data/processed/`.
  * Embedded DuckDB query engine in `analytics/duckdb_client.py` executing vectorized joins.
* [x] **Automated Data Quality Gatekeeper**:
  * Automated validator `analytics/data_quality.py` checking duplicate IDs, null required fields, invalid dates, foreign key orphans, negative amounts, impossible states, and duplicate transactions.
  * **Result**: **53/53 Checks Passed (100% Quality Score)** documented in `docs/data_quality_report.md`.
* [x] **Complete Data Documentation**:
  * Entity-Relationship diagram, column dictionary, and generation logic documented in `docs/data_dictionary.md`.


---

## 6. Dataset Reproduction & Verification Commands

To reproduce the dataset from scratch, run validation, and execute DuckDB analytical queries:

```bash
# 1. Regenerate synthetic dataset with fixed seed (outputs to data/raw/ and data/processed/)
python data/generate_dataset.py

# 2. Run Data Quality Gatekeeper (53 validation rules)
python analytics/data_quality.py

# 3. Run embedded DuckDB analytical aggregations over Parquet
python analytics/duckdb_client.py

# 4. Ingest into PostgreSQL (requires running postgres service)
python database/init_db.py

# 5. Run automated test suite
pytest tests/ -v
```

---

## 7. Local Setup & Execution

### Step 1: Environment Setup

```bash
# Clone the repository
git clone <repository_url>
cd Customer360

# Initialize environment configuration
cp .env.example .env
```

### Step 2: Backend (FastAPI)

```bash
# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run automated tests
pytest tests/ -v

# Start FastAPI server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend endpoints:
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health) -> `{"status": "ok"}`
* **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 3: Frontend (React + TypeScript + Vite)

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

* **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## 6. Docker Deployment Foundation

To launch the full containerized stack:

```bash
docker compose up --build -d
```

Services:
* **Frontend**: `http://localhost:3000`
* **API**: `http://localhost:8000`
* **PostgreSQL**: `localhost:5432`

---

## 7. Next Roadmap Phases

* **Phase 1: Data Engineering & Analytics**
  * Synthetic customer event generation & ingest into PostgreSQL
  * DuckDB analytical mart & dbt dimensional modeling
  * RFM scoring and cohort retention matrices
* **Phase 2: Predictive Machine Learning**
  * Churn prediction feature store
  * XGBoost training and tuning pipeline
  * SHAP feature contribution explainability
* **Phase 3: Intelligence & Serving**
  * FastAPI analytical query endpoints
  * Interactive Customer 360 dashboards
  * AI Copilot analyst integration
* **Phase 4: BI & Cloud Readiness**
  * Power BI semantic model & DAX calculations
  * Production cloud deployment configuration
