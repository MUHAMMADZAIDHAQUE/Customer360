# Contributing to Customer360

Thank you for your interest in contributing to **Customer360**! We welcome contributions to the analytical models, data quality checks, FastAPI backend, and React frontend.

---

## Code of Conduct

Please maintain a respectful and collaborative environment across all pull requests, code reviews, and issue discussions.

---

## Development Workflow

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/company/Customer360.git
cd Customer360

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm ci
cd ..
```

### 2. Local Service Startup
```bash
# Start Docker development environment (PostgreSQL + FastAPI + Frontend)
docker compose up -d

# Or run services locally:
# Terminal 1: Backend
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## Quality Gates & Testing Standards

All pull requests must pass the 6-stage CI/CD quality gate before merging:

```bash
# 1. Python Linting
flake8 api analytics ml tests

# 2. Frontend Validation & Tests
cd frontend
npx tsc --noEmit
npm test
npm run build
cd ..

# 3. Backend Pytest Suite
pytest tests/ -v

# 4. dbt Data Integrity Tests
dbt test --project-dir dbt --profiles-dir dbt

# 5. Data Quality 105-Rule Suite
python analytics/data_quality.py

# 6. Production Deployment Verification
python scripts/verify_production_deployment.py
```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/documentation-update`
2. **Commit Messages**: Follow Conventional Commits format:
   - `feat(api): add new customer cohort metric endpoint`
   - `fix(frontend): resolve kpi card badge layout overflow`
3. **Documentation**: Update relevant architecture guides in `docs/` and API docstrings whenever schemas or metrics change.
