"""
Customer360 ML Predictions Router
==================================
Serves real-time inference and SHAP explainability directly from the trained champion model.
"""

import os
import sys
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status

from api.schemas.prediction import (
    PredictionResponse,
    SHAPFactor,
    BatchPredictionResponse,
    BatchPredictionItem
)
from api.database import analytics_service

# Add project root to sys.path to load ml module
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from ml.inference import ChurnPredictor

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

# Global predictor singleton
_predictor = None


def get_predictor() -> ChurnPredictor:
    global _predictor
    if _predictor is None:
        _predictor = ChurnPredictor()
    return _predictor


@router.get(
    "",
    response_model=BatchPredictionResponse,
    summary="Batch Churn Predictions",
    description="Retrieve pre-computed ML churn risk scores and risk tiers across all customer accounts."
)
async def get_all_predictions(
    risk_level: Optional[str] = Query(None, description="Filter by risk tier (Low, Medium, High, Critical)"),
    limit: int = Query(100, ge=1, le=1000, description="Max accounts to return")
):
    sql = """
    SELECT 
        p.customer_id,
        ROUND(p.churn_probability, 4) as probability,
        p.risk_tier as risk_level,
        CAST(p.churn_probability >= 0.50 AS BOOLEAN) as is_at_risk,
        p.primary_risk_factor,
        ROUND(CAST(c.current_arr AS DOUBLE), 2) as annual_arr_at_risk
    FROM read_parquet('ml/artifacts/customer_churn_predictions.parquet') p
    JOIN main_marts.mart_customer_360 c ON p.customer_id = c.customer_id
    WHERE (? IS NULL OR p.risk_tier = ?)
    ORDER BY p.churn_probability DESC
    LIMIT ?;
    """
    rows = analytics_service.query_dicts(sql, [risk_level, risk_level, limit])

    agg_sql = """
    SELECT 
        COUNT(*) as total_scored,
        SUM(CASE WHEN risk_tier IN ('High', 'Critical') THEN 1 ELSE 0 END) as high_risk_count,
        ROUND(CAST(SUM(CASE WHEN risk_tier IN ('High', 'Critical') THEN c.current_arr ELSE 0 END) AS DOUBLE), 2) as total_arr_at_risk
    FROM read_parquet('ml/artifacts/customer_churn_predictions.parquet') p
    JOIN main_marts.mart_customer_360 c ON p.customer_id = c.customer_id;
    """
    agg = analytics_service.query_one(agg_sql)

    items = [BatchPredictionItem(**r) for r in rows]
    return BatchPredictionResponse(
        total_scored=agg["total_scored"] if agg else len(items),
        model_version="v1.0.0",
        high_or_critical_risk_count=agg["high_risk_count"] if agg else 0,
        total_arr_at_risk=agg["total_arr_at_risk"] if agg else 0.0,
        items=items
    )


@router.get(
    "/{customer_id}",
    response_model=PredictionResponse,
    summary="Real-Time Customer Churn Prediction & Explainability",
    description="Loads the actual trained model and preprocessor to generate real-time churn probability and SHAP risk factors."
)
async def get_customer_prediction(customer_id: str):
    # Verify customer exists in database first
    exists = analytics_service.query_one(
        "SELECT customer_id FROM main_marts.mart_customer_360 WHERE customer_id = ?;",
        [customer_id]
    )
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{customer_id}' was not found in database."
        )

    predictor = get_predictor()
    try:
        pred_res = predictor.predict_customer_by_id(customer_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    # Format SHAP risk factors
    risk_factors = [
        SHAPFactor(
            feature=f["feature"],
            shap_value=f["shap_value"],
            description=f"Risk driver elevating churn probability (+{f['shap_value']:.3f})"
        )
        for f in pred_res.get("top_risk_factors", [])
    ]

    protective_factors = [
        SHAPFactor(
            feature=f["feature"],
            shap_value=f["shap_value"],
            description=f"Retention driver lowering churn probability ({f['shap_value']:.3f})"
        )
        for f in pred_res.get("top_protective_factors", [])
    ]

    return PredictionResponse(
        customer_id=customer_id,
        probability=pred_res["churn_probability"],
        risk_level=pred_res["risk_tier"],
        model_version="v1.0.0",
        top_risk_factors=risk_factors,
        top_protective_factors=protective_factors
    )
