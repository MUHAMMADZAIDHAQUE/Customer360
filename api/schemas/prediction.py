"""
Customer360 ML Prediction Schemas
==================================
Typed models for model inference, risk tier classification, and SHAP explainability.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SHAPFactor(BaseModel):
    feature: str = Field(..., description="Feature name")
    shap_value: float = Field(..., description="Signed SHAP attribution contribution")
    description: Optional[str] = Field(None, description="Human-readable explanation")


class PredictionResponse(BaseModel):
    customer_id: str = Field(..., description="Customer unique identifier")
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted churn probability (0.0 to 1.0)")
    risk_level: str = Field(..., description="Risk category: Low (<25%), Medium (25-50%), High (50-75%), Critical (>75%)")
    model_version: str = Field(..., description="Trained model version tag (e.g. v1.0.0)")
    top_risk_factors: List[SHAPFactor] = Field(..., description="Top drivers increasing churn risk")
    top_protective_factors: Optional[List[SHAPFactor]] = Field(None, description="Top drivers preserving retention")


class BatchPredictionItem(BaseModel):
    customer_id: str
    probability: float
    risk_level: str
    is_at_risk: bool
    primary_risk_factor: str
    annual_arr_at_risk: float


class BatchPredictionResponse(BaseModel):
    total_scored: int
    model_version: str
    high_or_critical_risk_count: int
    total_arr_at_risk: float
    items: List[BatchPredictionItem]
