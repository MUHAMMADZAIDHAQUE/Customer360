"""
Customer360 Churn Analytics Router
===================================
Endpoints analyzing churn rates, timelines, contracts, plans, and tenure dynamics.
"""

from typing import List
from fastapi import APIRouter
from api.schemas.metrics import (
    ChurnSummary,
    ChurnReasonItem,
    ChurnTrend,
    ChurnByContract,
    ChurnByPlan,
    ChurnByTenure
)
from api.database import analytics_service

router = APIRouter(prefix="/churn", tags=["Churn Analytics"])


@router.get(
    "",
    response_model=ChurnSummary,
    summary="Churn Overview & Reasons",
    description="Returns aggregate churn percentages and top customer-reported cancellation reasons."
)
async def get_churn_summary():
    agg_sql = """
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
        SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active,
        ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate
    FROM main_marts.mart_customer_360;
    """
    agg = analytics_service.query_one(agg_sql)

    reasons_sql = """
    SELECT 
        churn_reason as reason,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM main_marts.mart_customer_360 WHERE is_churned), 2) as pct_of_churns
    FROM main_marts.mart_customer_360
    WHERE is_churned AND churn_reason IS NOT NULL
    GROUP BY churn_reason
    ORDER BY count DESC;
    """
    reasons = analytics_service.query_dicts(reasons_sql)

    return ChurnSummary(
        overall_churn_rate_pct=agg["churn_rate"],
        total_churned_count=agg["churned"],
        active_retained_count=agg["active"],
        top_churn_reasons=[ChurnReasonItem(**r) for r in reasons]
    )


@router.get(
    "/trends",
    response_model=List[ChurnTrend],
    summary="Monthly Churn Timeline",
    description="Returns chronological monthly active customer counts, new signups, and churn rates."
)
async def get_churn_trends():
    sql = """
    SELECT 
        strftime(observation_month, '%Y-%m') as observation_month,
        active_customers_count as active_customers,
        new_signups_count as new_signups,
        churned_customers_count as churned_customers,
        monthly_churn_rate_pct,
        ROUND(CAST(active_mrr AS DOUBLE), 2) as active_mrr
    FROM main_marts.mart_monthly_kpis
    ORDER BY observation_month;
    """
    rows = analytics_service.query_dicts(sql)
    return [ChurnTrend(**r) for r in rows]


@router.get(
    "/by-contract",
    response_model=List[ChurnByContract],
    summary="Churn by Contract Type",
    description="Examines churn rate, retained ARR, and average CLV across monthly, annual, and multi-year contracts."
)
async def get_churn_by_contract():
    sql = """
    SELECT 
        contract_type,
        COUNT(*) as total_customers,
        SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_count,
        ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as total_arr,
        ROUND(CAST(AVG(lifetime_billed_revenue) AS DOUBLE), 2) as avg_clv
    FROM main_marts.mart_customer_360
    GROUP BY contract_type
    ORDER BY total_customers DESC;
    """
    rows = analytics_service.query_dicts(sql)
    return [ChurnByContract(**r) for r in rows]


@router.get(
    "/by-plan",
    response_model=List[ChurnByPlan],
    summary="Churn by Subscription Plan",
    description="Examines subscriber attrition, average MRR, and total ARR across Starter, Growth, Pro, and Enterprise tiers."
)
async def get_churn_by_plan():
    sql = """
    SELECT 
        plan_tier,
        COUNT(*) as total_subscribers,
        SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_subscribers,
        ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
        ROUND(CAST(AVG(current_mrr) AS DOUBLE), 2) as avg_mrr,
        ROUND(CAST(SUM(current_arr) AS DOUBLE), 2) as total_arr
    FROM main_marts.mart_customer_360
    GROUP BY plan_tier
    ORDER BY total_arr DESC;
    """
    rows = analytics_service.query_dicts(sql)
    return [ChurnByPlan(**r) for r in rows]


@router.get(
    "/by-tenure",
    response_model=List[ChurnByTenure],
    summary="Churn by Customer Tenure",
    description="Evaluates lifecycle hazard rates across tenure brackets (0-3 mo, 4-6 mo, 7-12 mo, 13-24 mo, 25+ mo)."
)
async def get_churn_by_tenure():
    sql = """
    SELECT 
        CASE 
            WHEN tenure_months <= 3 THEN '01-03 months'
            WHEN tenure_months <= 6 THEN '04-06 months'
            WHEN tenure_months <= 12 THEN '07-12 months'
            WHEN tenure_months <= 24 THEN '13-24 months'
            ELSE '25+ months'
        END as tenure_bracket,
        COUNT(*) as total_customers,
        SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_count,
        ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
        ROUND(CAST(AVG(current_mrr) AS DOUBLE), 2) as avg_mrr
    FROM main_marts.mart_customer_360
    GROUP BY tenure_bracket
    ORDER BY tenure_bracket;
    """
    rows = analytics_service.query_dicts(sql)
    return [ChurnByTenure(**r) for r in rows]
