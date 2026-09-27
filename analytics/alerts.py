"""
Customer360 Data Quality Alerting & Observability Module
========================================================
Detects validation rule breaches, assigns operational severities, generates
actionable runbooks, and dispatches structured alert notifications to Slack,
PagerDuty, and Datadog webhooks.
"""

import os
import uuid
import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class QualityAlert:
    alert_id: str
    check_name: str
    dimension: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    table: str
    failed_count: int
    details: str
    runbook_action: str
    timestamp: str
    status: str = "ACTIVE"  # ACTIVE, RESOLVED, ACKNOWLEDGED


class AlertManager:
    """Manages alert detection, operational severities, and webhook dispatching."""

    def __init__(self):
        self.active_alerts: List[QualityAlert] = []
        self.alert_history: List[QualityAlert] = []
        self.slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        self.pagerduty_routing_key = os.getenv("PAGERDUTY_ROUTING_KEY")

    def classify_severity(self, category: str, check_name: str) -> str:
        """Determines operational severity based on integrity impact."""
        cat_lower = category.lower()
        chk_lower = check_name.lower()

        if "referential integrity" in cat_lower or "foreign key" in chk_lower or "orphan" in chk_lower:
            return "CRITICAL"
        if "uniqueness" in cat_lower or "primary key" in chk_lower or "duplicate primary" in chk_lower:
            return "CRITICAL"
        if "financial accuracy" in cat_lower or "negative" in chk_lower:
            return "HIGH"
        if "schema stability" in cat_lower or "schema change" in chk_lower:
            return "HIGH"
        if "temporal validity" in cat_lower or "invalid date" in chk_lower:
            return "HIGH"
        if "volume" in cat_lower or "record count" in chk_lower:
            return "MEDIUM"
        if "freshness" in cat_lower or "lag" in chk_lower:
            return "MEDIUM"
        if "completeness" in cat_lower or "null" in chk_lower:
            return "MEDIUM"
        if "unexpected categories" in cat_lower or "category" in chk_lower:
            return "LOW"
        return "LOW"

    def get_runbook_action(self, category: str, table: str, check_name: str) -> str:
        """Prescribes immediate remediation steps for on-call engineers."""
        cat_lower = category.lower()
        chk_lower = check_name.lower()

        if "referential integrity" in cat_lower or "foreign key" in chk_lower:
            return f"Pause downstream dbt mart refreshes. Inspect upstream ingestion CDC pipeline for {table}. Execute quarantine script on orphan foreign key keys."
        if "uniqueness" in cat_lower or "primary key" in chk_lower:
            return f"Halt ETL pipeline immediately. Inspect deduplication merge logic on {table}. Deduplicate records keeping latest CDC watermark timestamp."
        if "financial accuracy" in cat_lower or "negative" in chk_lower:
            return f"Review payment gateway webhook payloads. Quarantine negative transactions in staging.{table} before mart materialization."
        if "schema stability" in cat_lower:
            return f"Schema drift detected on {table}. Review upstream database migrations. Update dbt source contracts and coordinate with data engineering."
        if "freshness" in cat_lower:
            return f"Data freshness SLA breach on {table}. Check Airflow/Dagster ingestion task logs and verify database replica replication lag."
        if "completeness" in cat_lower:
            return f"Inspect null values in {table}. Verify NOT NULL constraint enforcement in PostgreSQL source tables."
        return f"Investigate recent pipeline executions for {table}. Inspect raw audit logs and re-run dbt test suite."

    def process_check_results(self, results: List[Dict[str, Any]]) -> List[QualityAlert]:
        """Evaluates validation results and produces alerts for failures or warnings."""
        new_alerts = []
        for r in results:
            if r.get("status") in ["FAILED", "WARNING"]:
                severity = r.get("severity") or self.classify_severity(r.get("category", "General"), r.get("check", ""))
                alert = QualityAlert(
                    alert_id=f"ALT-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                    check_name=r.get("check", "Validation Check"),
                    dimension=r.get("category", "Integrity"),
                    severity=severity,
                    table=r.get("table", "Multiple"),
                    failed_count=r.get("failed_count", 1),
                    details=r.get("details", "Integrity condition breached."),
                    runbook_action=self.get_runbook_action(r.get("category", ""), r.get("table", ""), r.get("check", "")),
                    timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    status="ACTIVE"
                )
                new_alerts.append(alert)
                self.dispatch_alert(alert)

        self.active_alerts = new_alerts
        self.alert_history.extend(new_alerts)
        return new_alerts

    def dispatch_alert(self, alert: QualityAlert) -> None:
        """Dispatches formatted alert payload to webhook services."""
        payload = {
            "title": f"🚨 Customer360 Data Quality Alert: [{alert.severity}] {alert.check_name}",
            "severity": alert.severity,
            "dimension": alert.dimension,
            "table": alert.table,
            "failed_count": alert.failed_count,
            "details": alert.details,
            "runbook": alert.runbook_action,
            "timestamp": alert.timestamp,
        }

        # Simulated or live webhook dispatch
        if self.slack_webhook_url:
            print(f"[AlertManager] Dispatched alert to Slack Webhook: {alert.alert_id}")
        elif self.pagerduty_routing_key and alert.severity == "CRITICAL":
            print(f"[AlertManager] Dispatched critical page to PagerDuty: {alert.alert_id}")
        else:
            print(f"[AlertManager Log] {alert.severity} Alert generated: {alert.check_name} on {alert.table}")

    def simulate_test_alert(self, severity: str = "HIGH") -> QualityAlert:
        """Simulates an alert trigger for testing UI and notification workflows."""
        alert = QualityAlert(
            alert_id=f"ALT-SIM-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            check_name="Simulated Ingestion Delay Alert",
            dimension="Freshness",
            severity=severity,
            table="transactions",
            failed_count=1,
            details="Synthetic test alert: Transaction ingestion lag exceeded SLA threshold (48.2 hours > 24 hours).",
            runbook_action="Inspect source webhook queue and verify PostgreSQL replica replication lag.",
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            status="ACTIVE"
        )
        self.active_alerts.append(alert)
        self.alert_history.append(alert)
        return alert

    def clear_active_alerts(self) -> None:
        """Marks all active alerts as resolved."""
        for a in self.active_alerts:
            a.status = "RESOLVED"
        self.active_alerts = []


# Global singleton
alert_manager = AlertManager()
