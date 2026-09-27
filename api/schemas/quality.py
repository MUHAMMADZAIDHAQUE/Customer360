"""
Customer360 Data Quality & Observability Schemas
================================================
Typed models for data hygiene, rule validation, dimension scoring, and alerts.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class QualityRuleResult(BaseModel):
    rule_name: str = Field(..., description="Validation rule name")
    category: str = Field(..., description="Quality dimension (Completeness, Uniqueness, Validity, Relationship Integrity, Freshness, Schema Stability & Volume)")
    table: str = Field(..., description="Target database table")
    status: str = Field(..., description="Validation outcome: PASSED, WARNING, or FAILED")
    severity: str = Field("HIGH", description="Severity if breached: CRITICAL, HIGH, MEDIUM, LOW")
    details: str = Field(..., description="Detailed explanation of test results")
    failed_count: int = Field(0, description="Number of violating records")
    threshold: Optional[str] = Field("0 violations", description="Acceptable tolerance threshold")


class QualityAlertSchema(BaseModel):
    alert_id: str = Field(..., description="Unique alert identifier")
    check_name: str = Field(..., description="Violating check name")
    dimension: str = Field(..., description="Quality dimension category")
    severity: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    table: str = Field(..., description="Impacted table")
    failed_count: int = Field(..., description="Number of violating records")
    details: str = Field(..., description="Technical failure details")
    runbook_action: str = Field(..., description="Prescribed remediation steps")
    timestamp: str = Field(..., description="Alert generation timestamp")
    status: str = Field("ACTIVE", description="ACTIVE, RESOLVED, ACKNOWLEDGED")


class FreshnessMetricsSchema(BaseModel):
    latest_transaction: Optional[str] = None
    latest_engagement: Optional[str] = None
    latest_ticket: Optional[str] = None
    max_lag_days: int = 0
    sla_status: str = "HEALTHY"


class DataQualityReport(BaseModel):
    status: str = Field(..., description="Overall dataset health status: PASSED, WARNING, or FAILED")
    total_rules: int = Field(..., description="Total validation checks executed")
    passed_rules: int = Field(..., description="Total passed checks")
    failed_rules: int = Field(0, description="Total failed checks")
    warning_rules: int = Field(0, description="Total warning checks")
    score_pct: float = Field(..., description="Data quality compliance score (0.0 - 100.0%)")
    dimension_scores: Dict[str, float] = Field(default_factory=dict, description="Transparent scores by quality dimension")
    freshness_metrics: FreshnessMetricsSchema = Field(default_factory=FreshnessMetricsSchema, description="Data freshness metrics")
    last_validated_at: str = Field(..., description="ISO timestamp of last execution")
    summary: str = Field(..., description="Executive summary of data foundation health")
    checks: List[QualityRuleResult] = Field(..., description="Detailed breakdown of validation checks")
    active_alerts: List[QualityAlertSchema] = Field(default_factory=list, description="Active data quality incident alerts")
