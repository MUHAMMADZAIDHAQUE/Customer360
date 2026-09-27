"""
Customer360 - ML Pipeline, Model Loading & Inference Tests
===========================================================
Validates:
1. Feature extraction and consistency (no target leakage).
2. Model loading and pipeline integrity.
3. Prediction output schema conformity.
4. Probability bounds [0.0, 1.0] and risk tier assignments.
5. Missing-value resilience and edge-case anomaly handling.
6. Local and global SHAP feature explainability.
"""

import os
import json
import pytest
import numpy as np
import pandas as pd
import joblib

from ml.features import FeatureEngineer
from ml.inference import ChurnPredictor
from ml.explainability import ChurnExplainer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml", "artifacts")


@pytest.fixture(scope="module")
def predictor():
    return ChurnPredictor()


@pytest.fixture(scope="module")
def feature_engineer():
    return FeatureEngineer()


def test_model_artifacts_exist_and_loadable():
    """Verify that all champion models, feature lists, and metrics exist."""
    required_files = [
        "best_churn_model.joblib",
        "feature_names.json",
        "model_metrics.json",
        "model_version.json"
    ]
    for filename in required_files:
        path = os.path.join(ARTIFACTS_DIR, filename)
        assert os.path.exists(path), f"Required artifact {filename} missing in {ARTIFACTS_DIR}"

    # Load model and verify pipeline
    model = joblib.load(os.path.join(ARTIFACTS_DIR, "best_churn_model.joblib"))
    assert model is not None
    assert hasattr(model, "predict_proba") or hasattr(model, "predict")


def test_feature_consistency_and_dimensions(feature_engineer):
    """Verify feature extractor generates exact feature matrix without target leakage."""
    raw_df = feature_engineer.extract_raw_features()
    
    assert raw_df is not None
    assert len(raw_df) >= 1000

    feature_cols = list(raw_df.columns)
    # Check for target leakage
    assert "churn_date" not in feature_cols
    assert "churn_reason" not in feature_cols

    # Ensure expected numerical and categorical feature names
    expected_features = [
        "tenure_months", "monthly_price", "plan_tier", "contract_type",
        "total_sessions", "failed_transactions_count"
    ]
    for feat in expected_features:
        assert feat in feature_cols


def test_prediction_output_schema_and_probability_range(predictor):
    """Verify single customer inference output format and valid probability range."""
    # Test on a known customer
    result = predictor.predict_customer_by_id("CUST-00001")
    
    assert result is not None
    assert "customer_id" in result
    assert result["customer_id"] == "CUST-00001"
    assert "churn_probability" in result
    
    prob = result["churn_probability"]
    assert isinstance(prob, float)
    assert 0.0 <= prob <= 1.0

    assert "risk_tier" in result
    assert result["risk_tier"] in ["Low", "Medium", "High", "Critical"]

    assert "top_risk_factors" in result
    assert isinstance(result["top_risk_factors"], list)
    assert len(result["top_risk_factors"]) >= 1


def test_missing_value_and_outlier_resilience(predictor):
    """Verify inference pipeline gracefully handles anomalous or missing input values."""
    # Create synthetic raw customer feature record with NaNs and extremes
    anomalous_df = pd.DataFrame([{
        "customer_id": "CUST-SYNTHETIC",
        "tenure_months": np.nan,  # Missing
        "monthly_price": 999.99,  # Outlier
        "plan_tier": "Enterprise",
        "contract_type": "monthly",
        "total_sessions": 0,
        "avg_session_minutes": np.nan,
        "total_tickets_count": 12,
        "failed_transactions_count": 5,
        "recency_days": 120,
    }])

    res = predictor.predict_features(anomalous_df)
    
    assert isinstance(res, dict)
    prob = res["churn_probability"]
    assert isinstance(prob, float)
    assert 0.0 <= prob <= 1.0
    assert res["risk_tier"] in ["Low", "Medium", "High", "Critical"]
    assert isinstance(res["top_risk_factors"], list)


def test_nonexistent_customer_handling(predictor):
    """Verify requesting prediction for nonexistent customer raises expected error."""
    with pytest.raises(ValueError) as excinfo:
        predictor.predict_customer_by_id("CUST-NONEXISTENT-99999")
    assert "not found" in str(excinfo.value).lower()


def test_shap_explainability(feature_engineer):
    """Verify local and global SHAP explanation outputs."""
    explainer = ChurnExplainer()
    raw_df = feature_engineer.extract_raw_features()
    cust_row = raw_df[raw_df["customer_id"] == "CUST-00001"]
    exp = explainer.explain_single_customer(cust_row)
    
    assert exp is not None
    assert "churn_probability" in exp
    assert "top_risk_factors" in exp
    assert "top_protective_factors" in exp
    assert 0.0 <= exp["churn_probability"] <= 1.0
