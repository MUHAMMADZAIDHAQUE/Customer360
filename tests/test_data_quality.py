"""
Tests for Data Quality & Observability Layer (Phase 9).

Validates:
1. Comprehensive monitoring across 9 required areas:
   - Null values (Completeness)
   - Duplicates (Uniqueness)
   - Invalid relationships (Relationship Integrity)
   - Invalid dates (Validity)
   - Negative values (Validity)
   - Unexpected categories (Validity)
   - Schema changes (Schema Stability & Volume)
   - Record counts (Schema Stability & Volume)
   - Freshness (Freshness)
2. Transparent Quality Score calculation across all dimensions (no invented numbers).
3. Alerting engine, severity classification, and runbook generation.
4. FastAPI REST API endpoints for Data Quality, run-on-demand, and alert lifecycle.
"""

import pytest
from fastapi.testclient import TestClient
from analytics.data_quality import DataQualityValidator
from analytics.alerts import alert_manager, QualityAlert
from api.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def quality_validator():
    validator = DataQualityValidator()
    validator.run_all()
    return validator


def test_quality_engine_execution(quality_validator):
    """Verify that the engine runs and populates results, scores, and freshness."""
    assert quality_validator.results is not None
    assert len(quality_validator.results) >= 100
    assert quality_validator.dimension_scores is not None
    assert quality_validator.freshness_metrics is not None
    assert quality_validator.last_validated_at is not None

    total_rules = len(quality_validator.results)
    passed_rules = sum(1 for r in quality_validator.results if r["status"] == "PASSED")
    failed_rules = sum(1 for r in quality_validator.results if r["status"] == "FAILED")

    assert total_rules >= 100
    assert passed_rules == total_rules
    assert failed_rules == 0


def test_transparent_quality_score(quality_validator):
    """Verify quality score is strictly calculated from documented checks without invention."""
    results = quality_validator.results
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    expected_score = round((passed / total) * 100, 1)

    assert quality_validator.dimension_scores["Overall"] == expected_score

    # Check each dimension score matches the ratio of passed checks in that category
    required_dimensions = [
        "Completeness",
        "Uniqueness",
        "Validity",
        "Relationship Integrity",
        "Freshness",
        "Schema Stability & Volume",
    ]
    for dim in required_dimensions:
        assert dim in quality_validator.dimension_scores
        cat_checks = [r for r in results if r["category"] == dim]
        cat_passed = sum(1 for r in cat_checks if r["status"] == "PASSED")
        expected_dim_score = round((cat_passed / len(cat_checks)) * 100.0, 1)
        assert quality_validator.dimension_scores[dim] == expected_dim_score


def test_nine_core_monitoring_areas(quality_validator):
    """Verify all 9 core monitoring requirements are actively checked."""
    results = quality_validator.results
    check_names = [r["check"] for r in results]
    categories = set(r["category"] for r in results)

    # 1. Null values
    assert any("Not Null" in name for name in check_names)
    assert "Completeness" in categories

    # 2. Duplicates
    assert any("Duplicate Primary Key" in name or "Duplicate Active Subscriptions" in name or "Duplicate Transaction" in name for name in check_names)
    assert "Uniqueness" in categories

    # 3. Invalid relationships (Foreign keys)
    assert any("Foreign Key" in name or "Referential" in name for name in check_names)
    assert "Relationship Integrity" in categories

    # 4. Invalid dates
    assert any("Date" in name for name in check_names)
    assert "Validity" in categories

    # 5. Negative values
    assert any("Non-Negative" in name for name in check_names)

    # 6. Unexpected categories
    assert any("Categorical Domain" in name or "Category" in name for name in check_names)

    # 7. Schema changes
    assert any("Schema Stability" in name for name in check_names)

    # 8. Record counts (Volume)
    assert any("Record Volume" in name for name in check_names)

    # 9. Freshness
    assert any("Freshness" in name for name in check_names)
    assert "Freshness" in categories


def test_freshness_metrics_structure(quality_validator):
    """Verify freshness SLA metrics and timestamp reporting."""
    freshness = quality_validator.freshness_metrics
    assert freshness is not None
    assert "latest_transaction" in freshness
    assert "latest_engagement" in freshness
    assert "latest_ticket" in freshness
    assert "max_lag_days" in freshness
    assert "sla_status" in freshness
    assert freshness["sla_status"] == "HEALTHY"


def test_alert_manager_simulation_and_clearing():
    """Verify alert manager triggers, classifies, and clears incidents."""
    alert_manager.clear_active_alerts()
    assert len(alert_manager.active_alerts) == 0

    # Simulate an incident
    simulated = alert_manager.simulate_test_alert(severity="HIGH")

    assert simulated is not None
    assert simulated.check_name == "Simulated Ingestion Delay Alert"
    assert simulated.severity == "HIGH"
    assert simulated.status == "ACTIVE"
    assert len(alert_manager.active_alerts) == 1

    # Clear alerts
    alert_manager.clear_active_alerts()
    assert len(alert_manager.active_alerts) == 0


def test_alert_severity_classification():
    """Verify severity classifier maps domain failures to correct operational tiers."""
    crit_sev = alert_manager.classify_severity("Relationship Integrity", "Foreign key violation")
    assert crit_sev == "CRITICAL"

    pk_sev = alert_manager.classify_severity("Uniqueness", "Duplicate Primary Key")
    assert pk_sev == "CRITICAL"

    date_sev = alert_manager.classify_severity("Temporal Validity", "Invalid Date Chronology")
    assert date_sev == "HIGH"

    fresh_sev = alert_manager.classify_severity("Freshness", "Transaction Lag")
    assert fresh_sev == "MEDIUM"

    cat_sev = alert_manager.classify_severity("Unexpected Categories", "Enum Whitelist Violation")
    assert cat_sev == "LOW"

    # Test runbook action generation
    runbook = alert_manager.get_runbook_action("Relationship Integrity", "subscriptions", "Foreign key violation")
    assert "downstream" in runbook.lower() or "quarantine" in runbook.lower()


def test_api_get_data_quality(client):
    """Test GET /data-quality endpoint."""
    response = client.get("/data-quality")
    assert response.status_code == 200
    data = response.json()

    assert "score_pct" in data
    assert data["score_pct"] == 100.0
    assert data["total_rules"] >= 100
    assert data["failed_rules"] == 0
    assert "dimension_scores" in data
    assert "freshness_metrics" in data
    assert "checks" in data
    assert len(data["checks"]) == data["total_rules"]
    assert data["status"] == "PASSED"


def test_api_run_data_quality_audit(client):
    """Test POST /data-quality/run on-demand execution."""
    response = client.post("/data-quality/run")
    assert response.status_code == 200
    data = response.json()

    assert data["score_pct"] == 100.0
    assert data["total_rules"] >= 100
    assert data["passed_rules"] == data["total_rules"]


def test_api_alerts_lifecycle(client):
    """Test alert APIs: GET /data-quality/alerts, POST /simulate-alert, POST /clear-alerts."""
    # Ensure starting clean
    client.post("/data-quality/clear-alerts")

    # 1. Get alerts (should be empty)
    res_initial = client.get("/data-quality/alerts")
    assert res_initial.status_code == 200
    assert len(res_initial.json()) == 0

    # 2. Simulate alert
    res_sim = client.post("/data-quality/simulate-alert")
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["severity"] == "HIGH"
    assert sim_data["table"] == "transactions"

    # 3. Verify in active alerts
    res_active = client.get("/data-quality/alerts")
    assert res_active.status_code == 200
    assert len(res_active.json()) >= 1
    assert any(a["table"] == "transactions" for a in res_active.json())

    # 4. Clear alerts
    res_clear = client.post("/data-quality/clear-alerts")
    assert res_clear.status_code == 200
    assert "resolved" in res_clear.json()["message"].lower()

    # 5. Verify empty again
    res_final = client.get("/data-quality/alerts")
    assert len(res_final.json()) == 0
