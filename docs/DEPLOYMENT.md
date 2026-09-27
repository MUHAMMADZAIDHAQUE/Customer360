# Customer360 - Production Deployment Guide & Runbook

**AI-Powered Customer Intelligence & Retention Platform**  
**Repository**: [https://github.com/MUHAMMADZAIDHAQUE/Customer360](https://github.com/MUHAMMADZAIDHAQUE/Customer360)

---

## 1. Production Architecture Overview

```
                          ┌────────────────────────────────────────┐
                          │         Web Clients & Browsers         │
                          └───────────────────┬────────────────────┘
                                              │ (HTTPS)
                                              ▼
                          ┌────────────────────────────────────────┐
                          │   React 18 Single-Page App (SPA)       │
                          │   Hosted on Render / Vercel / Netlify  │
                          │   (Auto Gzip, CDN Caching, TypeScript) │
                          └───────────────────┬────────────────────┘
                                              │ (HTTPS REST API / JSON)
                                              ▼
                          ┌────────────────────────────────────────┐
                          │     FastAPI Analytical API Service     │
                          │     (Uvicorn, Async, Pydantic v2)      │
                          └───────┬──────────────┬──────────────┬──┘
                                  │              │              │
                   ┌──────────────▼────┐  ┌──────▼───────┐  ┌───▼──────────────┐
                   │ Managed PostgreSQL│  │ DuckDB OLAP  │  │ ML TreeSHAP      │
                   │ Relational 3NF    │  │ Parquet Marts│  │ Inference Engine │
                   │ (Supabase / Render│  │ In-Memory    │  │ (XGBoost / Joblib│
                   │ / Neon / AWS RDS) │  │ Vectorized   │  │ Feature Pipeline)│
                   └───────────────────┘  └──────────────┘  └──────────────────┘
```

---

## 2. Option 1: One-Click Render Blueprint (Recommended)

Customer360 includes a production-ready **Render Blueprint** (`render.yaml`) that provisions the managed database, Python backend service, and React frontend in a single coordinated project.

### Step-by-Step Instructions:
1. **Push Changes to GitHub**:
   Ensure your latest code is on your GitHub repository:
   ```bash
   git push origin main
   ```
2. **Log in to Render**:
   Open [https://dashboard.render.com](https://dashboard.render.com) and log in with your GitHub account.
3. **Deploy the Blueprint**:
   * Click **New +** $\rightarrow$ **Blueprint**.
   * Select your repository: `MUHAMMADZAIDHAQUE/Customer360`.
   * Render will detect `render.yaml` and display the 3 services:
     1. `customer360-db` (Managed PostgreSQL)
     2. `customer360-api` (FastAPI Web Service)
     3. `customer360-frontend` (React Static Site)
   * Click **Apply**.
4. **Initialize Production Database**:
   Once the backend service is deployed, open the Render **Shell** tab for `customer360-api` and run:
   ```bash
   python database/init_db.py
   ```
   *This creates all 9 relational tables, applies B-Tree performance indexes, and ingests the synthetic Customer360 dataset.*
5. **Access Your Live Platform**:
   * Frontend URL: `https://customer360-frontend.onrender.com`
   * Backend API: `https://customer360-api.onrender.com`
   * OpenAPI Documentation: `https://customer360-api.onrender.com/docs`

---

## 3. Option 2: Hybrid Deployment (Vercel Frontend + Render Backend + Neon/Supabase PostgreSQL)

For ultra-fast global CDN edge delivery, you can host the frontend on **Vercel** and backend on **Render** or **Railway**.

### Step A: Deploy PostgreSQL (Neon / Supabase / Render)
1. Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string:
   `postgresql://username:password@ep-host.neon.tech/customer360_db?sslmode=require`

### Step B: Deploy FastAPI Backend (Render / Railway)
1. Create a new **Web Service** on Render/Railway connected to your GitHub repo.
2. Set configuration:
   * **Root Directory**: `.` (Repository root)
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   * **Health Check Path**: `/health`
3. Add Environment Variables:
   * `ENVIRONMENT`: `production`
   * `DEBUG`: `false`
   * `DATABASE_URL`: `<your-neon-or-supabase-postgres-url>`
   * `CORS_ORIGINS`: `https://your-app.vercel.app,http://localhost:5173`
4. Deploy and copy your backend URL (e.g. `https://customer360-api.onrender.com`).

### Step C: Deploy React Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set configuration:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add Environment Variable:
   * `VITE_API_URL`: `https://customer360-api.onrender.com`
4. Click **Deploy**. Vercel will build and assign your live HTTPS domain (`https://customer360.vercel.app`).

---

## 4. Option 3: Production Docker Compose on any Cloud VM (AWS EC2 / DigitalOcean / Hetzner)

For dedicated server hosting with isolated networking:

```bash
# 1. Clone repository on server
git clone https://github.com/MUHAMMADZAIDHAQUE/Customer360.git
cd Customer360

# 2. Configure production environment file
cp .env.production.example .env

# 3. Launch hardened multi-container stack
docker compose -f docker-compose.prod.yml up -d --build

# 4. Ingest and migrate database
docker compose -f docker-compose.prod.yml exec api python database/init_db.py

# 5. Verify deployment health
docker compose -f docker-compose.prod.yml exec api python scripts/verify_production_deployment.py
```

---

## 5. Production Environment Variables Reference

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `ENVIRONMENT` | **Yes** | `production` (enables structured JSON logging, disables debug endpoints) |
| `DEBUG` | **Yes** | `false` |
| `LOG_LEVEL` | No | `INFO` (or `WARNING`, `ERROR`) |
| `API_HOST` | **Yes** | `0.0.0.0` |
| `PORT` / `API_PORT` | **Yes** | `$PORT` (dynamically assigned by hosting provider, defaults to `8000`) |
| `DATABASE_URL` | **Yes** | `postgresql://user:password@host:5432/customer360_db` |
| `CORS_ORIGINS` | **Yes** | Comma-separated list of allowed frontend domains (e.g. `https://customer360-frontend.onrender.com,https://customer360.vercel.app`) |
| `VITE_API_URL` | **Yes** | (Frontend only) Full public URL to the backend API (e.g. `https://customer360-api.onrender.com`) |
| `OPENAI_API_KEY` | Optional | Optional OpenAI API key for generative text paraphrasing in AI Analyst |

---

## 6. Verification and Health Check Runbook

Once deployed, verify your live public platform by running these verification probes:

1. **System Health Probe**:
   ```bash
   curl -i https://<your-backend-api>/health
   # Expected: HTTP/2 200 OK, {"status": "ok", "database": "connected", "model_loaded": true, "version": "0.1.0"}
   ```
2. **Executive Metrics Endpoint**:
   ```bash
   curl https://<your-backend-api>/metrics
   # Expected: Total customers: 1500, Active MRR: 113256.0, Active ARR: 1359072.0
   ```
3. **ML Prediction Inference**:
   ```bash
   curl https://<your-backend-api>/predictions/CUST-00001
   # Expected: Real-time churn probability + TreeSHAP risk factors
   ```
4. **AI Analyst Grounded Query**:
   ```bash
   curl -X POST https://<your-backend-api>/analyst/query \
     -H "Content-Type: application/json" \
     -d '{"query": "How much revenue is at risk?"}'
   ```
5. **Data Quality Scorecard**:
   ```bash
   curl https://<your-backend-api>/data-quality
   # Expected: 105 checks evaluated, 100% score
   ```
6. **Frontend Web Client**:
   * Open `https://<your-frontend-domain>` in your browser.
   * Verify all 10 analytical views load dynamic data.
   * Test Dark/Light theme switching in the top navigation bar.
   * Search for customer accounts (e.g. "Donald") and click "View 360° Profile" to verify TreeSHAP risk attribution.

---

## 7. Troubleshooting & Rollback Guide

### Symptom: Frontend shows "API Unreachable"
* **Check**: Open browser DevTools Network tab. Verify the requested API URL.
* **Fix**: Ensure `VITE_API_URL` environment variable is set on the frontend static host and points to `https://<your-backend-domain>` without trailing slashes.

### Symptom: CORS Error on API Calls
* **Check**: Backend error logs: `Origin https://... not allowed`.
* **Fix**: Add your exact frontend domain to `CORS_ORIGINS` environment variable on your backend web service and restart.

### Symptom: Database Connection Refused
* **Check**: Ensure `DATABASE_URL` uses the correct username, password, host, and port. If using Supabase or Neon, append `?sslmode=require` to the connection string.
