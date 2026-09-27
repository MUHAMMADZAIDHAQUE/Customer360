"""
Customer360 Customers Router
=============================
Provides paginated, filtered, sorted customer directory and detailed customer profile views.
"""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from api.schemas.common import PaginatedResponse
from api.schemas.customer import CustomerSummary, CustomerDetail
from api.database import analytics_service

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get(
    "",
    response_model=PaginatedResponse[CustomerSummary],
    summary="List Customers (Paginated & Filtered)",
    description="Retrieve paginated customers with optional filtering by status, tier, contract, and text search."
)
async def list_customers(
    page: int = Query(1, ge=1, description="Page index (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    customer_status: Optional[str] = Query(None, alias="status", pattern="^(active|churned)$", description="Filter by status ('active' or 'churned')"),
    plan_tier: Optional[str] = Query(None, description="Filter by plan tier (Starter, Growth, Professional, Enterprise)"),
    contract_type: Optional[str] = Query(None, description="Filter by contract type (monthly, annual, multi_year)"),
    country: Optional[str] = Query(None, description="Filter by country name"),
    is_at_risk: Optional[bool] = Query(None, description="Filter by high risk accounts"),
    search: Optional[str] = Query(None, description="Search by name, email, or customer ID"),
    sort_by: str = Query("current_arr", description="Column to sort by (current_arr, current_mrr, tenure_months, total_sessions)"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction")
):
    valid_sort_cols = {
        "current_arr": "c.current_arr",
        "current_mrr": "c.current_mrr",
        "tenure_months": "c.tenure_months",
        "total_sessions": "c.total_sessions",
        "signup_date": "c.signup_date",
        "customer_id": "c.customer_id"
    }
    sort_column = valid_sort_cols.get(sort_by, "c.current_arr")
    order_dir = "DESC" if sort_order.lower() == "desc" else "ASC"

    # Build safe parameterized query
    where_clauses = ["1=1"]
    params = []

    if customer_status:
        where_clauses.append("c.customer_status = ?")
        params.append(customer_status)

    if plan_tier:
        where_clauses.append("c.plan_tier = ?")
        params.append(plan_tier)

    if contract_type:
        where_clauses.append("c.contract_type = ?")
        params.append(contract_type)

    if country:
        where_clauses.append("c.country = ?")
        params.append(country)

    if is_at_risk is not None:
        where_clauses.append("c.is_at_risk = ?")
        params.append(is_at_risk)

    if search:
        search_pattern = f"%{search.strip()}%"
        where_clauses.append("(c.customer_id ILIKE ? OR c.full_name ILIKE ? OR c.email ILIKE ?)")
        params.extend([search_pattern, search_pattern, search_pattern])

    where_sql = " AND ".join(where_clauses)

    # Count total
    count_sql = f"SELECT COUNT(*) as total FROM main_marts.mart_customer_360 c WHERE {where_sql};"
    count_res = analytics_service.query_one(count_sql, params)
    total_records = count_res["total"] if count_res else 0

    # Paged query
    offset = (page - 1) * page_size
    query_params = list(params) + [page_size, offset]

    select_sql = f"""
    SELECT 
        c.customer_id,
        c.full_name,
        c.email,
        c.country,
        c.plan_name,
        c.plan_tier,
        c.contract_type,
        c.customer_status,
        c.is_churned,
        ROUND(CAST(c.current_mrr AS DOUBLE), 2) as current_mrr,
        ROUND(CAST(c.current_arr AS DOUBLE), 2) as current_arr,
        ROUND(c.tenure_months, 1) as tenure_months,
        CAST(COALESCE(c.total_sessions, 0) AS BIGINT) as total_sessions,
        ROUND(COALESCE(c.avg_satisfaction_score, 0.0), 2) as avg_satisfaction_score,
        c.has_support_friction,
        c.is_engagement_declining,
        COALESCE(p.risk_tier, CASE WHEN c.is_churned THEN 'Critical' WHEN c.is_at_risk THEN 'High' ELSE 'Low' END) as risk_tier,
        ROUND(COALESCE(p.churn_probability, CASE WHEN c.is_churned THEN 1.0 ELSE 0.05 END), 4) as churn_probability
    FROM main_marts.mart_customer_360 c
    LEFT JOIN (
        SELECT customer_id, churn_probability, risk_tier 
        FROM read_parquet('ml/artifacts/customer_churn_predictions.parquet')
    ) p ON c.customer_id = p.customer_id
    WHERE {where_sql}
    ORDER BY {sort_column} {order_dir}
    LIMIT ? OFFSET ?;
    """
    rows = analytics_service.query_dicts(select_sql, query_params)

    items = [CustomerSummary(**row) for row in rows]
    total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 0

    return PaginatedResponse(
        items=items,
        total=total_records,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerDetail,
    summary="Get Customer Details",
    description="Retrieve full 360-degree demographic, behavioral, financial, and ML risk profile for an account."
)
async def get_customer(customer_id: str):
    sql = """
    SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        c.full_name,
        c.email,
        c.age,
        c.gender,
        c.country,
        c.region,
        c.city,
        strftime(c.signup_date, '%Y-%m-%d') as signup_date,
        c.acquisition_channel,
        c.plan_name,
        c.plan_tier,
        c.contract_type,
        c.customer_status,
        c.is_churned,
        ROUND(CAST(c.current_mrr AS DOUBLE), 2) as current_mrr,
        ROUND(CAST(c.current_arr AS DOUBLE), 2) as current_arr,
        ROUND(c.tenure_months, 1) as tenure_months,
        ROUND(CAST(c.lifetime_billed_revenue AS DOUBLE), 2) as lifetime_billed_revenue,
        CAST(COALESCE(c.total_invoices_count, 0) AS BIGINT) as total_invoices_count,
        CAST(COALESCE(c.failed_transactions_count, 0) AS BIGINT) as failed_transactions_count,
        c.has_payment_delinquency,
        CAST(COALESCE(c.total_sessions, 0) AS BIGINT) as total_sessions,
        ROUND(CAST(COALESCE(c.total_session_minutes, 0) AS DOUBLE), 1) as total_session_minutes,
        ROUND(COALESCE(c.avg_session_minutes, 0.0), 1) as avg_session_minutes,
        CAST(COALESCE(c.total_logins, 0) AS BIGINT) as total_logins,
        CAST(COALESCE(c.distinct_features_used, 0) AS BIGINT) as distinct_features_used,
        CAST(COALESCE(c.total_active_days, 0) AS BIGINT) as total_active_days,
        c.is_engagement_declining,
        CAST(COALESCE(c.total_tickets_count, 0) AS BIGINT) as total_tickets_count,
        CAST(COALESCE(c.high_urgency_tickets_count, 0) AS BIGINT) as high_urgency_tickets_count,
        ROUND(COALESCE(c.avg_resolution_hours, 0.0), 1) as avg_resolution_hours,
        ROUND(COALESCE(c.avg_satisfaction_score, 0.0), 2) as avg_satisfaction_score,
        c.has_support_friction,
        strftime(c.churn_date, '%Y-%m-%d') as churn_date,
        c.churn_reason,
        c.churn_type,
        c.churn_feedback,
        COALESCE(p.risk_tier, CASE WHEN c.is_churned THEN 'Critical' WHEN c.is_at_risk THEN 'High' ELSE 'Low' END) as risk_tier,
        ROUND(COALESCE(p.churn_probability, CASE WHEN c.is_churned THEN 1.0 ELSE 0.05 END), 4) as churn_probability,
        p.top_risk_factors,
        p.top_protective_factors
    FROM main_marts.mart_customer_360 c
    LEFT JOIN (
        SELECT customer_id, churn_probability, risk_tier, top_risk_factors, top_protective_factors
        FROM read_parquet('ml/artifacts/customer_churn_predictions.parquet')
    ) p ON c.customer_id = p.customer_id
    WHERE c.customer_id = ?;
    """
    row = analytics_service.query_one(sql, [customer_id])
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' was not found in the database."
        )

    # Parse JSON strings for SHAP factors if present
    if row.get("top_risk_factors") and isinstance(row["top_risk_factors"], str):
        try:
            row["top_risk_factors"] = json.loads(row["top_risk_factors"])
        except Exception:
            row["top_risk_factors"] = []

    if row.get("top_protective_factors") and isinstance(row["top_protective_factors"], str):
        try:
            row["top_protective_factors"] = json.loads(row["top_protective_factors"])
        except Exception:
            row["top_protective_factors"] = []

    return CustomerDetail(**row)
