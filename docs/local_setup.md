# Customer360 - Local Setup & Development Guide

This guide covers running the Customer360 platform locally for Phase 0 development.

---

## 1. Prerequisites

Ensure you have the following installed on your host machine:

* **Python**: 3.10+ (tested on Python 3.11)
* **Node.js**: 18+ (tested on Node v20+)
* **npm**: 9+
* **Git**: 2.30+
* **Docker & Docker Compose** *(Optional for local bare-metal, recommended for containerized testing)*

---

## 2. Environment Configuration

Clone the repository and initialize your `.env` configuration file:

```bash
git clone <repository_url>
cd Customer360

# Copy environment template
cp .env.example .env
```

Review `.env` to customize ports or credentials if needed. Default values are pre-configured for out-of-the-box local operation.

---

## 3. Backend Setup (FastAPI)

### 3.1 Create Virtual Environment & Install Dependencies

```bash
# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.2 Run Automated Tests

Verify backend health checks and configuration:

```bash
pytest tests/ -v
```

### 3.3 Start the FastAPI Server

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
* Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)
* Swagger UI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc UI: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Frontend Setup (React + TypeScript + Vite)

### 4.1 Install Node Dependencies

```bash
cd frontend
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

The frontend application will start at:
* Local URL: [http://localhost:5173](http://localhost:5173)

---

## 5. Dockerized Execution (Alternative)

If Docker and Docker Compose are installed on your machine:

```bash
# Build and run all services in detached mode
docker compose up --build -d

# View container logs
docker compose logs -f

# Verify running services
docker compose ps

# Stop containers
docker compose down
```

Ports mapped in Docker Compose:
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`
* PostgreSQL: `localhost:5432`

---

## 6. Verifying Phase 0 Acceptance Criteria

1. **Backend Health Check**:
   ```bash
   curl -i http://localhost:8000/health
   # Expected response: HTTP/1.1 200 OK -> {"status":"ok"}
   ```

2. **Frontend UI**:
   * Open [http://localhost:5173](http://localhost:5173)
   * Verify the default theme is **Dark Mode**
   * Toggle to **Light Mode** using the header theme switcher
   * Refresh the page to confirm the theme preference persists via `localStorage`
   * Check the live status card showing `Backend: Online` with real-time latency
