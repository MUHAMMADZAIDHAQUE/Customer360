"""
Customer360 Executive Metrics Router
====================================
Serves authoritative canonical business KPIs for the executive platform.
"""

from fastapi import APIRouter
from api.schemas.metrics import ExecutiveMetrics
from api.database import analytics_service

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get(
    "",
    response_model=ExecutiveMetrics,
    summary="Executive Business KPIs",
    description="Returns authoritative canonical business KPIs (ARR, MRR, ARPU, Churn Rate, Revenue at Risk)."
)
async def get_executive_metrics():
    sql = """
    SELECT 
        COUNT(*) as total_customers,
        CAST(SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) AS BIGINT) as active_customers,
        CAST(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) AS BIGINT) as churned_customers,
        ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
        ROUND(100.0 - (SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as retention_rate_pct,
        ROUND(CAST(SUM(current_mrr) AS DOUBLE), 2) as active_mrr,
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as active_arr,
        ROUND(CAST(SUM(current_mrr) AS DOUBLE) / NULLIF(SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END), 0), 2) as arpu,
        ROUND(CAST(SUM(lifetime_billed_revenue) AS DOUBLE), 2) as total_realized_revenue,
        ROUND(CAST(SUM(CASE WHEN is_at_risk THEN current_arr ELSE 0 END) AS DOUBLE), 2) as total_revenue_at_risk,
        CAST(SUM(CASE WHEN is_at_risk THEN 1 ELSE 0 END) AS BIGINT) as at_risk_accounts_count
    FROM main_marts.mart_customer_360;
    """
    row = analytics_service.query_one(sql)
    return ExecutiveMetrics(**row)
