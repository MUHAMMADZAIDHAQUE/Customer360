"""
Customer360 Backend API Integration & Regression Test Suite
===========================================================
Validates:
1. System Health (/health, /)
2. Customers Directory & Profiles (/customers, /customers/{customer_id})
   - Pagination
   - Filtering (status, plan_tier, contract_type)
   - Sorting
   - Search
3. Authoritative SaaS Metrics (/metrics)
4. Churn Analytics (/churn, /churn/trends, /churn/by-contract, /churn/by-plan, /churn/by-tenure)
5. Behavioral Segments (/segments)
6. Cohort Retention Matrix (/cohorts)
7. Revenue & At-Risk Accounts (/revenue, /revenue/at-risk)
8. Machine Learning Predictions (/predictions, /predictions/{customer_id})
   - Live champion model inference
   - Correct schema: customer_id, probability, risk_level, model_version, top_risk_factors
9. Input Validation & Error Handling (HTTP 422 for invalid parameters)
10. Missing Customer Error Handling (HTTP 404 for unknown customer IDs)
11. Data Quality Monitoring (/data-quality)
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.database import analytics_service

client = TestClient(app)


# ==============================================================================
# 1. HEALTH & SYSTEM
# ==============================================================================

def test_health_endpoint():
    """Verify /health returns 200 with operational status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["model_loaded"] is True
    assert data["version"] == "1.0.0"


def test_root_endpoint():
    """Verify root endpoint returns project metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Customer360"
    assert data["status"] == "operational"
    assert "docs" in data


# ==============================================================================
# 2. CUSTOMERS DIRECTORY & PROFILES
# ==============================================================================

def test_customers_pagination_default():
    """Verify default pagination parameters on /customers."""
    response = client.get("/customers")
    assert response.status_code == 200
    data = response.json()
    
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total"] == 1500
    assert len(data["items"]) == 20
    assert data["total_pages"] == 75

    first = data["items"][0]
    assert "customer_id" in first
    assert "full_name" in first
    assert "email" in first
    assert "current_arr" in first
    assert "plan_tier" in first


def test_customers_filter_by_status():
    """Verify filtering customers by active status."""
    response = client.get("/customers?status=active&page_size=30")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["customer_status"] == "active"
        assert item["is_churned"] is False


def test_customers_filter_by_plan_tier():
    """Verify filtering customers by plan tier."""
    response = client.get("/customers?plan_tier=Enterprise")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["plan_tier"] == "Enterprise"


def test_customers_filter_by_contract_type():
    """Verify filtering customers by contract type."""
    response = client.get("/customers?contract_type=annual")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["contract_type"] == "annual"


def test_customers_sorting_arr_desc():
    """Verify sorting customers by current_arr in descending order."""
    response = client.get("/customers?sort_by=current_arr&sort_order=desc&page_size=10")
    assert response.status_code == 200
    items = response.json()["items"]
    arrs = [item["current_arr"] for item in items]
    assert arrs == sorted(arrs, reverse=True)


def test_customers_sorting_tenure_asc():
    """Verify sorting customers by tenure_months in ascending order."""
    response = client.get("/customers?sort_by=tenure_months&sort_order=asc&page_size=10")
    assert response.status_code == 200
    items = response.json()["items"]
    tenures = [item["tenure_months"] for item in items]
    assert tenures == sorted(tenures)


def test_customers_search_by_id():
    """Verify search filter by customer ID."""
    response = client.get("/customers?search=CUST-00001")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(c["customer_id"] == "CUST-00001" for c in data["items"])


def test_customer_detail_success():
    """Verify full 360-degree customer profile retrieval."""
    response = client.get("/customers/CUST-00001")
    assert response.status_code == 200
    detail = response.json()

    # Core Identifiers
    assert detail["customer_id"] == "CUST-00001"
    assert "email" in detail
    assert "full_name" in detail
    assert "country" in detail

    # Financial & Telemetry
    assert "current_arr" in detail
    assert "lifetime_billed_revenue" in detail
    assert "total_sessions" in detail
    assert "avg_satisfaction_score" in detail
    assert "has_support_friction" in detail
    assert "is_engagement_declining" in detail


# ==============================================================================
# 3. CANONICAL SAAS METRICS
# ==============================================================================

def test_metrics_executive_kpis():
    """Verify /metrics returns canonical SaaS business metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    kpis = response.json()

    assert kpis["total_customers"] == 1500
    assert kpis["active_customers"] > 0
    assert kpis["churned_customers"] > 0
    assert kpis["churn_rate_pct"] > 0
    assert kpis["retention_rate_pct"] > 0
    assert kpis["active_mrr"] > 0
    assert kpis["active_arr"] > 0
    assert kpis["arpu"] > 0
    assert kpis["total_realized_revenue"] > 0
    assert kpis["total_revenue_at_risk"] > 0
    assert kpis["at_risk_accounts_count"] > 0


# ==============================================================================
# 4. CHURN ANALYTICS
# ==============================================================================

def test_churn_summary():
    """Verify /churn overview returns churn rate and cancellation reasons."""
    response = client.get("/churn")
    assert response.status_code == 200
    data = response.json()

    assert "overall_churn_rate_pct" in data
    assert "total_churned_count" in data
    assert "active_retained_count" in data
    assert "top_churn_reasons" in data
    assert len(data["top_churn_reasons"]) > 0

    reason = data["top_churn_reasons"][0]
    assert "reason" in reason
    assert "count" in reason
    assert "pct_of_churns" in reason


def test_churn_trends():
    """Verify /churn/trends returns chronological monthly timeline."""
    response = client.get("/churn/trends")
    assert response.status_code == 200
    trends = response.json()
    assert isinstance(trends, list)
    assert len(trends) > 0

    first = trends[0]
    assert "observation_month" in first
    assert "active_customers" in first
    assert "new_signups" in first
    assert "churned_customers" in first
    assert "monthly_churn_rate_pct" in first
    assert "active_mrr" in first


def test_churn_by_contract():
    """Verify /churn/by-contract returns contract-type breakdowns."""
    response = client.get("/churn/by-contract")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

    contracts = [item["contract_type"] for item in data]
    assert "monthly" in contracts
    assert "annual" in contracts


def test_churn_by_plan():
    """Verify /churn/by-plan returns tier-level attrition metrics."""
    response = client.get("/churn/by-plan")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4

    tiers = [item["plan_tier"] for item in data]
    assert "Enterprise" in tiers
    assert "Starter" in tiers


def test_churn_by_tenure():
    """Verify /churn/by-tenure returns tenure lifecycle brackets."""
    response = client.get("/churn/by-tenure")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "tenure_bracket" in data[0]
    assert "churn_rate_pct" in data[0]


# ==============================================================================
# 5. SEGMENTS, COHORTS & REVENUE
# ==============================================================================

def test_segments_endpoint():
    """Verify /segments returns RFM behavioral segments with playbooks."""
    response = client.get("/segments")
    assert response.status_code == 200
    segments = response.json()
    assert isinstance(segments, list)
    assert len(segments) > 0

    seg = segments[0]
    assert "rfm_segment" in seg
    assert "customer_count" in seg
    assert "active_count" in seg
    assert "churn_rate_pct" in seg
    assert "total_active_arr" in seg
    assert "retention_playbook" in seg


def test_cohorts_endpoint():
    """Verify /cohorts returns triangular retention matrix."""
    response = client.get("/cohorts")
    assert response.status_code == 200
    cohorts = response.json()
    assert isinstance(cohorts, list)
    assert len(cohorts) > 0

    row = cohorts[0]
    assert "cohort_month" in row
    assert "cohort_size" in row
    assert "retention_percentages" in row
    assert "M+0" in row["retention_percentages"]


def test_revenue_summary():
    """Verify /revenue returns MRR, ARR, ARPU, and plan shares."""
    response = client.get("/revenue")
    assert response.status_code == 200
    rev = response.json()
    assert "total_mrr" in rev
    assert "total_arr" in rev
    assert "arpu" in rev
    assert "total_realized_clv" in rev
    assert "plan_breakdown" in rev
    assert len(rev["plan_breakdown"]) > 0


def test_revenue_at_risk():
    """Verify /revenue/at-risk identifies vulnerable accounts."""
    response = client.get("/revenue/at-risk?limit=15")
    assert response.status_code == 200
    data = response.json()
    assert "total_arr_at_risk" in data
    assert "at_risk_account_count" in data
    assert "accounts" in data
    assert len(data["accounts"]) <= 15
    if data["accounts"]:
        acct = data["accounts"][0]
        assert "customer_id" in acct
        assert "annual_arr_at_risk" in acct
        assert "churn_probability" in acct


# ==============================================================================
# 6. ML PREDICTIONS (ACTUAL TRAINED MODEL + SHAP)
# ==============================================================================

def test_predictions_batch():
    """Verify /predictions batch scoring endpoint."""
    response = client.get("/predictions?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total_scored" in data
    assert "model_version" in data
    assert "high_or_critical_risk_count" in data
    assert "items" in data
    assert len(data["items"]) == 10

    item = data["items"][0]
    assert "customer_id" in item
    assert 0.0 <= item["probability"] <= 1.0
    assert item["risk_level"] in ["Low", "Medium", "High", "Critical"]
    assert "primary_risk_factor" in item


def test_prediction_single_customer_with_real_model():
    """Verify /predictions/{customer_id} runs actual trained ML pipeline with SHAP."""
    # Fetch an actual customer ID from database
    row = analytics_service.query_one("SELECT customer_id FROM main_marts.mart_customer_360 LIMIT 1;")
    customer_id = row["customer_id"]

    response = client.get(f"/predictions/{customer_id}")
    assert response.status_code == 200
    pred = response.json()

    # Exact requirements specified in prompt:
    # customer_id, probability, risk_level, model_version, top_risk_factors
    assert pred["customer_id"] == customer_id
    assert isinstance(pred["probability"], float)
    assert 0.0 <= pred["probability"] <= 1.0
    assert pred["risk_level"] in ["Low", "Medium", "High", "Critical"]
    assert pred["model_version"] == "v1.0.0"
    assert isinstance(pred["top_risk_factors"], list)
    assert len(pred["top_risk_factors"]) > 0

    factor = pred["top_risk_factors"][0]
    assert "feature" in factor
    assert "shap_value" in factor
    assert factor["shap_value"] > 0.0


# ==============================================================================
# 7. INVALID REQUESTS (VALIDATION & HTTP 422)
# ==============================================================================

def test_invalid_pagination_page_zero():
    """Verify page < 1 returns 422 Unprocessable Entity."""
    response = client.get("/customers?page=0")
    assert response.status_code == 422
    err = response.json()
    assert err["error"] == "VALIDATION_ERROR"
    assert err["status_code"] == 422


def test_invalid_pagination_page_negative():
    """Verify page < 0 returns 422 Unprocessable Entity."""
    response = client.get("/customers?page=-5")
    assert response.status_code == 422
    err = response.json()
    assert err["error"] == "VALIDATION_ERROR"


def test_invalid_page_size_exceeds_max():
    """Verify page_size > 100 returns 422 Unprocessable Entity."""
    response = client.get("/customers?page_size=500")
    assert response.status_code == 422
    err = response.json()
    assert err["error"] == "VALIDATION_ERROR"


def test_invalid_customer_status():
    """Verify invalid status query param returns 422."""
    response = client.get("/customers?status=unknown_status")
    assert response.status_code == 422
    err = response.json()
    assert err["error"] == "VALIDATION_ERROR"


def test_invalid_sort_order():
    """Verify invalid sort_order returns 422."""
    response = client.get("/customers?sort_order=diagonal")
    assert response.status_code == 422
    err = response.json()
    assert err["error"] == "VALIDATION_ERROR"


# ==============================================================================
# 8. MISSING CUSTOMERS (HTTP 404 ERROR HANDLING)
# ==============================================================================

def test_missing_customer_detail_returns_404():
    """Verify requesting non-existent customer returns structured 404."""
    response = client.get("/customers/NONEXISTENT-99999")
    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert "not found" in data["message"].lower()


def test_missing_customer_prediction_returns_404():
    """Verify predicting for non-existent customer returns structured 404."""
    response = client.get("/predictions/NONEXISTENT-99999")
    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert "not found" in data["message"].lower()


# ==============================================================================
# 9. DATA QUALITY MONITORING
# ==============================================================================

def test_data_quality_endpoint():
    """Verify /data-quality returns compliance scorecard and checks."""
    response = client.get("/data-quality")
    assert response.status_code == 200
    dq = response.json()

    assert dq["status"] in ["PASSED", "WARNING", "FAILED"]
    assert dq["total_rules"] > 0
    assert dq["passed_rules"] > 0
    assert dq["score_pct"] >= 90.0
    assert len(dq["checks"]) > 0

    rule = dq["checks"][0]
    assert "rule_name" in rule
    assert "status" in rule
    assert "category" in rule
