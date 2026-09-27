"""
Customer360 Revenue Analytics Router
====================================
Serves revenue distribution, plan contribution, and detailed at-risk revenue exposure.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from api.schemas.metrics import RevenueSummary, RevenuePlanItem, RevenueAtRiskResponse, AtRiskAccountItem
from api.database import analytics_service

router = APIRouter(prefix="/revenue", tags=["Revenue Analytics"])


@router.get(
    "",
    response_model=RevenueSummary,
    summary="Revenue Overview & Plan Breakdown",
    description="Returns aggregate recurring revenue, ARPU, cumulative realized cash, and plan tier shares."
)
async def get_revenue_summary():
    agg_sql = """
    SELECT 
        ROUND(CAST(SUM(current_mrr) AS DOUBLE), 2) as total_mrr,
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as total_arr,
        ROUND(CAST(SUM(current_mrr) AS DOUBLE) / NULLIF(SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END), 0), 2) as arpu,
        ROUND(CAST(SUM(lifetime_billed_revenue) AS DOUBLE), 2) as total_realized_clv
    FROM main_marts.mart_customer_360;
    """
    agg = analytics_service.query_one(agg_sql)

    plan_sql = """
    SELECT 
        plan_name,
        plan_tier,
        COUNT(*) as total_subscribers,
        SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active_subscribers,
        ROUND(CAST(SUM(current_mrr) AS DOUBLE), 2) as plan_mrr,
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as plan_arr,
        ROUND(CAST(SUM(current_arr) AS DOUBLE) * 100.0 / (SELECT SUM(current_arr) FROM main_marts.mart_customer_360), 2) as arr_share_pct
    FROM main_marts.mart_customer_360
    GROUP BY plan_name, plan_tier
    ORDER BY plan_arr DESC;
    """
    plans = analytics_service.query_dicts(plan_sql)

    return RevenueSummary(
        total_mrr=agg["total_mrr"],
        total_arr=agg["total_arr"],
        arpu=agg["arpu"],
        total_realized_clv=agg["total_realized_clv"],
        plan_breakdown=[RevenuePlanItem(**p) for p in plans]
    )


@router.get(
    "/at-risk",
    response_model=RevenueAtRiskResponse,
    summary="High-Value Accounts at Risk",
    description="Identifies active accounts exhibiting severe engagement decay, support friction, or payment delinquency."
)
async def get_revenue_at_risk(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of accounts to return")
):
    summary_sql = """
    SELECT 
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as total_arr_at_risk,
        COUNT(*) as at_risk_count
    FROM main_marts.mart_customer_360
    WHERE is_at_risk;
    """
    summary = analytics_service.query_one(summary_sql)

    accounts_sql = f"""
    SELECT 
        c.customer_id,
        c.full_name,
        c.country,
        c.plan_tier,
        c.contract_type,
        ROUND(CAST(c.current_mrr AS DOUBLE), 2) as current_mrr,
        ROUND(CAST(c.revenue_at_risk AS DOUBLE), 2) as annual_arr_at_risk,
        ROUND(COALESCE(c.avg_satisfaction_score, 0.0), 2) as avg_satisfaction_score,
        COALESCE(c.total_tickets_count, 0) as total_tickets_count,
        c.is_engagement_declining,
        c.has_support_friction,
        c.has_payment_delinquency,
        ROUND(COALESCE(p.churn_probability, 0.75), 4) as churn_probability,
        COALESCE(p.risk_tier, 'High') as risk_tier
    FROM main_marts.mart_customer_360 c
    LEFT JOIN (
        SELECT customer_id, churn_probability, risk_tier
        FROM read_parquet('{analytics_service.predictions_parquet_path}')
    ) p ON c.customer_id = p.customer_id
    WHERE c.is_at_risk
    ORDER BY c.revenue_at_risk DESC
    LIMIT ?;
    """
    accounts = analytics_service.query_dicts(accounts_sql, [limit])

    return RevenueAtRiskResponse(
        total_arr_at_risk=summary["total_arr_at_risk"] if summary else 0.0,
        at_risk_account_count=summary["at_risk_count"] if summary else 0,
        accounts=[AtRiskAccountItem(**a) for a in accounts]
    )
