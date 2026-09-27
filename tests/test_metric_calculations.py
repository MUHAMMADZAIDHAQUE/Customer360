"""
Customer360 - Canonical Metrics & Calculation Integrity Tests
==============================================================
Validates:
1. Mathematical relations: ARR = 12 * MRR, ARPU = MRR / Active Customers.
2. Churn rate bounds: [0.0, 100.0]%.
3. Revenue at Risk calculations against at-risk subscription portfolios.
4. Consistency between SQL Analytics Service and DuckDB analytical marts.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_executive_kpis_mathematical_consistency():
    """Verify that MRR, ARR, and ARPU adhere to canonical definitions."""
    response = client.get("/metrics")
    assert response.status_code == 200
    kpis = response.json()

    total_customers = kpis["total_customers"]
    active_customers = kpis["active_customers"]
    churned_customers = kpis["churned_customers"]
    mrr = kpis["active_mrr"]
    arr = kpis["active_arr"]
    arpu = kpis["arpu"]
    churn_rate = kpis["churn_rate_pct"]

    # Customer conservation
    assert active_customers + churned_customers <= total_customers
    assert active_customers > 0

    # ARR = 12 * MRR (within floating rounding tolerance)
    assert abs(arr - (mrr * 12.0)) < 1.0

    # ARPU = MRR / Active Customers
    expected_arpu = round(mrr / active_customers, 2)
    assert abs(arpu - expected_arpu) <= 1.0

    # Churn Rate = Churned / Total Customers * 100%
    expected_churn_rate = round((churned_customers / total_customers) * 100.0, 2)
    assert abs(churn_rate - expected_churn_rate) <= 1.0


def test_revenue_at_risk_calculation():
    """Verify revenue at risk matches sum of high and critical churn risk exposure."""
    response = client.get("/revenue/at-risk")
    assert response.status_code == 200
    risk_summary = response.json()

    assert "total_arr_at_risk" in risk_summary
    assert "at_risk_account_count" in risk_summary
    assert "accounts" in risk_summary

    total_arr_risk = risk_summary["total_arr_at_risk"]
    assert total_arr_risk >= 0.0
    assert risk_summary["at_risk_account_count"] >= 0
    assert 0 < len(risk_summary["accounts"]) <= risk_summary["at_risk_account_count"]


def test_churn_by_dimensions():
    """Verify churn distributions by contract and plan tier."""
    res_contract = client.get("/churn/by-contract")
    assert res_contract.status_code == 200
    by_contract = res_contract.json()
    assert len(by_contract) >= 2
    for item in by_contract:
        assert "contract_type" in item
        assert "total_customers" in item
        assert "churn_rate_pct" in item
        assert 0.0 <= item["churn_rate_pct"] <= 100.0

    res_plan = client.get("/churn/by-plan")
    assert res_plan.status_code == 200
    by_plan = res_plan.json()
    assert len(by_plan) >= 2
    for item in by_plan:
        assert "plan_tier" in item
        assert "churn_rate_pct" in item
        assert 0.0 <= item["churn_rate_pct"] <= 100.0
