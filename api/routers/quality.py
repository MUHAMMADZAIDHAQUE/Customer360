"""
Customer360 Data Quality & Observability Router
===============================================
Exposes endpoints for dataset hygiene validation, transparent dimension scores,
audit rule evaluations, and incident alerts.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, status, HTTPException
import datetime

from api.schemas.quality import (
    DataQualityReport,
    QualityRuleResult,
    QualityAlertSchema,
    FreshnessMetricsSchema,
)
from analytics.data_quality import DataQualityValidator
from analytics.alerts import alert_manager

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])


def execute_audit_suite() -> DataQualityReport:
    """Executes full validator suite and compiles transparent report."""
    validator = DataQualityValidator()
    validator.load_data()
    validator.validate_uniqueness()
    validator.validate_completeness()
    validator.validate_dates()
    validator.validate_negative_values()
    validator.validate_unexpected_categories()
    validator.validate_relationship_integrity()
    validator.validate_schema_changes()
    validator.validate_record_counts()
    validator.validate_freshness()

    validator.last_validated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    overall_score = validator.calculate_transparent_scores()

    # Generate alerts for any failures
    alert_manager.process_check_results(validator.results)

    total_rules = len(validator.results)
    passed_rules = sum(1 for r in validator.results if r["status"] == "PASSED")
    failed_rules = sum(1 for r in validator.results if r["status"] == "FAILED")
    warning_rules = sum(1 for r in validator.results if r["status"] == "WARNING")

    checks = [
        QualityRuleResult(
            rule_name=r["check"],
            category=r["category"],
            table=r["table"],
            status=r["status"],
            severity=r.get("severity", "HIGH"),
            details=r["details"],
            failed_count=r.get("failed_count", 0),
            threshold=r.get("threshold", "0 violations")
        )
        for r in validator.results
    ]

    active_alerts = [
        QualityAlertSchema(
            alert_id=a.alert_id,
            check_name=a.check_name,
            dimension=a.dimension,
            severity=a.severity,
            table=a.table,
            failed_count=a.failed_count,
            details=a.details,
            runbook_action=a.runbook_action,
            timestamp=a.timestamp,
            status=a.status
        )
        for a in alert_manager.active_alerts
    ]

    overall_status = "PASSED" if failed_rules == 0 and warning_rules == 0 else ("WARNING" if failed_rules == 0 else "FAILED")

    return DataQualityReport(
        status=overall_status,
        total_rules=total_rules,
        passed_rules=passed_rules,
        failed_rules=failed_rules,
        warning_rules=warning_rules,
        score_pct=overall_score,
        dimension_scores=validator.dimension_scores,
        freshness_metrics=FreshnessMetricsSchema(**validator.freshness_metrics),
        last_validated_at=validator.last_validated_at,
        summary=f"Data foundation validated across {total_rules} rules with a {overall_score:.1f}% compliance score. {len(active_alerts)} active alerts.",
        checks=checks,
        active_alerts=active_alerts
    )


@router.get(
    "",
    response_model=DataQualityReport,
    summary="Data Quality Health Report",
    description="Returns aggregate dataset quality compliance rate, transparent dimension scores, and rule verification outcomes."
)
async def get_data_quality() -> DataQualityReport:
    try:
        return execute_audit_suite()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute data quality audit suite: {str(exc)}"
        )


@router.post(
    "/run",
    response_model=DataQualityReport,
    summary="Trigger Real-Time Audit",
    description="Executes a live on-demand data quality validation run across all entities."
)
async def run_data_quality_audit() -> DataQualityReport:
    return execute_audit_suite()


@router.get(
    "/alerts",
    response_model=List[QualityAlertSchema],
    summary="Active Data Quality Alerts",
    description="Returns active incident alerts detected across validation checks."
)
async def get_quality_alerts() -> List[QualityAlertSchema]:
    return [
        QualityAlertSchema(
            alert_id=a.alert_id,
            check_name=a.check_name,
            dimension=a.dimension,
            severity=a.severity,
            table=a.table,
            failed_count=a.failed_count,
            details=a.details,
            runbook_action=a.runbook_action,
            timestamp=a.timestamp,
            status=a.status
        )
        for a in alert_manager.active_alerts
    ]


@router.post(
    "/simulate-alert",
    response_model=QualityAlertSchema,
    summary="Simulate Test Incident Alert",
    description="Injects a synthetic test alert to demonstrate incident alerting workflows and UI notifications."
)
async def simulate_quality_alert() -> QualityAlertSchema:
    alert = alert_manager.simulate_test_alert(severity="HIGH")
    return QualityAlertSchema(
        alert_id=alert.alert_id,
        check_name=alert.check_name,
        dimension=alert.dimension,
        severity=alert.severity,
        table=alert.table,
        failed_count=alert.failed_count,
        details=alert.details,
        runbook_action=alert.runbook_action,
        timestamp=alert.timestamp,
        status=alert.status
    )


@router.post(
    "/clear-alerts",
    summary="Clear Active Alerts",
    description="Resolves all active alerts in the incident queue."
)
async def clear_quality_alerts() -> Dict[str, str]:
    alert_manager.clear_active_alerts()
    return {"message": "All active data quality alerts resolved successfully."}
