"""
Customer360 Customer Segments Router
====================================
Serves quantitative RFM behavioral segments and retention playbooks.
"""

from typing import List
from fastapi import APIRouter
from api.schemas.metrics import SegmentSummary
from api.database import analytics_service

router = APIRouter(prefix="/segments", tags=["Customer Segments"])


@router.get(
    "",
    response_model=List[SegmentSummary],
    summary="RFM Behavioral Segments",
    description="Returns aggregate customer counts, churn rates, ARR contributions, and action playbooks across RFM segments."
)
async def get_segments():
    sql = """
    SELECT 
        rfm_segment,
        COUNT(*) as customer_count,
        SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN customer_status = 'churned' THEN 1 ELSE 0 END) as churned_count,
        ROUND(SUM(CASE WHEN customer_status = 'churned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
        ROUND(CAST(SUM(CASE WHEN customer_status = 'active' THEN current_arr ELSE 0 END) AS DOUBLE), 2) as total_active_arr,
        ROUND(CAST(AVG(monetary_spend) AS DOUBLE), 2) as avg_clv,
        MAX(retention_playbook) as retention_playbook
    FROM main_marts.mart_customer_segments
    GROUP BY rfm_segment
    ORDER BY total_active_arr DESC;
    """
    rows = analytics_service.query_dicts(sql)
    return [SegmentSummary(**r) for r in rows]
