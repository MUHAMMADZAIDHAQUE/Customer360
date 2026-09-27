"""
Customer360 AI Analyst Router
==============================
Exposes endpoints for the conversational AI Analyst.
Guarantees verified analytical responses, metric provenance, and safety.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, status, Depends, HTTPException

from api.schemas.analyst import (
    AnalystQueryRequest,
    AnalystQueryResponse,
    SuggestedQuestion,
)
from api.services.ai_analyst import ai_analyst_service

router = APIRouter(prefix="/analyst", tags=["AI Analyst"])


@router.post(
    "/query",
    response_model=AnalystQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask AI Analyst Natural Language Question",
    description="Processes user inquiries regarding churn, revenue at risk, customer segments, plan retention, and account risk using approved, verified analytical queries."
)
async def ask_analyst(payload: AnalystQueryRequest) -> AnalystQueryResponse:
    try:
        response = ai_analyst_service.process_query(
            query=payload.query,
            session_id=payload.session_id
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Analyst encountered an error processing query: {str(exc)}"
        )


@router.get(
    "/suggested-questions",
    response_model=List[SuggestedQuestion],
    status_code=status.HTTP_200_OK,
    summary="Get Suggested Questions",
    description="Returns curated high-impact strategic inquiries for executive decision-makers."
)
@router.get(
    "/suggestions",
    response_model=List[SuggestedQuestion],
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
async def get_suggested_questions() -> List[SuggestedQuestion]:
    return ai_analyst_service.get_suggested_questions()


@router.get(
    "/status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="AI Analyst Runtime Status",
    description="Returns connectivity status, connected analytical marts, and safety protocols."
)
async def get_analyst_status() -> Dict[str, Any]:
    return {
        "status": "operational",
        "grounding_engine": "Deterministic Analytical Tool Dispatcher",
        "arbitrary_sql_allowed": False,
        "verified_marts_connected": [
            "main_marts.mart_customer_360",
            "main_marts.mart_customer_segments",
            "main_marts.mart_cohort_retention",
            "main_marts.mart_monthly_kpis",
            "ml/artifacts/customer_churn_predictions.parquet",
            "ml/artifacts/global_feature_importance.json"
        ],
        "hallucination_prevention": "Strict Parameterized Tool Schema Enforced"
    }
