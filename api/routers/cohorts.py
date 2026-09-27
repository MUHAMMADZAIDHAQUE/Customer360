"""
Customer360 Cohort Retention Router
===================================
Serves triangular cohort retention matrix data from signup-month cohorts through Month 12.
"""

from typing import List, Dict, Optional
from fastapi import APIRouter
from api.schemas.metrics import CohortMatrixRow
from api.database import analytics_service

router = APIRouter(prefix="/cohorts", tags=["Cohort Analysis"])


@router.get(
    "",
    response_model=List[CohortMatrixRow],
    summary="Cohort Retention Matrix",
    description="Returns triangular monthly retention rates (Month 0 through Month 12) for all signup cohorts."
)
async def get_cohorts():
    sql = """
    SELECT 
        strftime(cohort_month, '%Y-%m') as cohort_month,
        MAX(cohort_size) as cohort_size,
        ROUND(MAX(CASE WHEN month_number = 0 THEN retention_rate_pct END), 1) as m0,
        ROUND(MAX(CASE WHEN month_number = 1 THEN retention_rate_pct END), 1) as m1,
        ROUND(MAX(CASE WHEN month_number = 2 THEN retention_rate_pct END), 1) as m2,
        ROUND(MAX(CASE WHEN month_number = 3 THEN retention_rate_pct END), 1) as m3,
        ROUND(MAX(CASE WHEN month_number = 4 THEN retention_rate_pct END), 1) as m4,
        ROUND(MAX(CASE WHEN month_number = 5 THEN retention_rate_pct END), 1) as m5,
        ROUND(MAX(CASE WHEN month_number = 6 THEN retention_rate_pct END), 1) as m6,
        ROUND(MAX(CASE WHEN month_number = 7 THEN retention_rate_pct END), 1) as m7,
        ROUND(MAX(CASE WHEN month_number = 8 THEN retention_rate_pct END), 1) as m8,
        ROUND(MAX(CASE WHEN month_number = 9 THEN retention_rate_pct END), 1) as m9,
        ROUND(MAX(CASE WHEN month_number = 10 THEN retention_rate_pct END), 1) as m10,
        ROUND(MAX(CASE WHEN month_number = 11 THEN retention_rate_pct END), 1) as m11,
        ROUND(MAX(CASE WHEN month_number = 12 THEN retention_rate_pct END), 1) as m12
    FROM main_marts.mart_cohort_retention
    GROUP BY strftime(cohort_month, '%Y-%m')
    ORDER BY cohort_month;
    """
    rows = analytics_service.query_dicts(sql)

    matrix = []
    for r in rows:
        pcts = {
            f"M+{i}": r.get(f"m{i}") for i in range(13)
        }
        matrix.append(CohortMatrixRow(
            cohort_month=r["cohort_month"],
            cohort_size=r["cohort_size"],
            retention_percentages=pcts
        ))

    return matrix
