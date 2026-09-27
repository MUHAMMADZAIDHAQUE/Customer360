"""
Customer360 Analytical Metrics Schemas
======================================
Authoritative KPI schemas for executive dashboards, churn, revenue, and retention.
"""

from typing import List, Dict, Any, Optional
from datetime import date
from pydantic import BaseModel, Field


class ExecutiveMetrics(BaseModel):
    total_customers: int = Field(..., description="Total unique customer count in dataset")
    active_customers: int = Field(..., description="Currently active subscription accounts")
    churned_customers: int = Field(..., description="Total cancelled/churned accounts")
    churn_rate_pct: float = Field(..., description="Overall churn rate percentage (0.0 - 100.0%)")
    retention_rate_pct: float = Field(..., description="Overall retention rate percentage")
    active_mrr: float = Field(..., description="Monthly Recurring Revenue from active subscriptions")
    active_arr: float = Field(..., description="Annual Run Rate from active subscriptions")
    arpu: float = Field(..., description="Average Revenue Per User (MRR / active customers)")
    total_realized_revenue: float = Field(..., description="Cumulative gross cash collected to date")
    total_revenue_at_risk: float = Field(..., description="Annual run-rate exposure of at-risk accounts")
    at_risk_accounts_count: int = Field(..., description="Number of active accounts flagged as at-risk")


class ChurnReasonItem(BaseModel):
    reason: str
    count: int
    pct_of_churns: float


class ChurnSummary(BaseModel):
    overall_churn_rate_pct: float
    total_churned_count: int
    active_retained_count: int
    top_churn_reasons: List[ChurnReasonItem]


class ChurnTrend(BaseModel):
    observation_month: str
    active_customers: int
    new_signups: int
    churned_customers: int
    monthly_churn_rate_pct: float
    active_mrr: float


class ChurnByContract(BaseModel):
    contract_type: str
    total_customers: int
    churned_count: int
    churn_rate_pct: float
    total_arr: float
    avg_clv: float


class ChurnByPlan(BaseModel):
    plan_tier: str
    total_subscribers: int
    churned_subscribers: int
    churn_rate_pct: float
    avg_mrr: float
    total_arr: float


class ChurnByTenure(BaseModel):
    tenure_bracket: str
    total_customers: int
    churned_count: int
    churn_rate_pct: float
    avg_mrr: float


class SegmentSummary(BaseModel):
    rfm_segment: str
    customer_count: int
    active_count: int
    churned_count: int
    churn_rate_pct: float
    total_active_arr: float
    avg_clv: float
    retention_playbook: Optional[str] = None


class CohortMatrixRow(BaseModel):
    cohort_month: str
    cohort_size: int
    retention_percentages: Dict[str, Optional[float]] = Field(
        ..., description="Dict mapping month index (M+0, M+1... M+12) to retention %"
    )


class RevenuePlanItem(BaseModel):
    plan_name: str
    plan_tier: str
    total_subscribers: int
    active_subscribers: int
    plan_mrr: float
    plan_arr: float
    arr_share_pct: float


class RevenueSummary(BaseModel):
    total_mrr: float
    total_arr: float
    arpu: float
    total_realized_clv: float
    plan_breakdown: List[RevenuePlanItem]


class AtRiskAccountItem(BaseModel):
    customer_id: str
    full_name: str
    country: str
    plan_tier: str
    contract_type: str
    current_mrr: float
    annual_arr_at_risk: float
    avg_satisfaction_score: float
    total_tickets_count: int
    is_engagement_declining: bool
    has_support_friction: bool
    has_payment_delinquency: bool
    churn_probability: Optional[float] = None
    risk_tier: Optional[str] = None


class RevenueAtRiskResponse(BaseModel):
    total_arr_at_risk: float
    at_risk_account_count: int
    accounts: List[AtRiskAccountItem]
