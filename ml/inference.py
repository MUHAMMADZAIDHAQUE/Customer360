"""
Customer360 - Production Inference Engine
==========================================
Loads the champion model and preprocessor pipeline from ml/artifacts/
to generate low-latency real-time predictions and SHAP explainability.
Ready for direct consumption by the FastAPI backend.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

import sys
ml_dir = os.path.dirname(os.path.abspath(__file__))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

try:
    from ml.features import FeatureEngineer
    from ml.explainability import ChurnExplainer
except ImportError:
    from features import FeatureEngineer
    from explainability import ChurnExplainer

ARTIFACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))


class ChurnPredictor:
    def __init__(self, model_path: str = None):
        if model_path is None:
            model_path = os.path.join(ARTIFACT_DIR, "best_churn_model.joblib")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Run ml/train.py first.")

        self.model = joblib.load(model_path)
        self.fe = FeatureEngineer()
        self.explainer = ChurnExplainer(model_path)

        # Load feature metadata
        features_json = os.path.join(ARTIFACT_DIR, "feature_names.json")
        with open(features_json, "r") as f:
            self.feature_meta = json.load(f)
            self.expected_features = self.feature_meta["all_features"]

    def predict_features(self, df_features: pd.DataFrame) -> Dict[str, Any]:
        """Runs inference on a single-row or multi-row DataFrame containing raw features."""
        # Ensure all expected columns are present
        for col in self.expected_features:
            if col not in df_features.columns:
                df_features[col] = np.nan

        X = df_features[self.expected_features].copy()
        probs = self.model.predict_proba(X)[:, 1]
        
        results = []
        for i in range(len(df_features)):
            prob = float(probs[i])
            single_row = X.iloc[[i]]
            explanation = self.explainer.explain_single_customer(single_row)
            
            results.append({
                "churn_probability": round(prob, 4),
                "churn_probability_pct": round(prob * 100.0, 2),
                "risk_tier": explanation["risk_tier"],
                "is_at_risk": bool(prob >= 0.50),
                "top_risk_factors": explanation["top_risk_factors"],
                "top_protective_factors": explanation["top_protective_factors"]
            })

        return results[0] if len(results) == 1 else results

    def predict_customer_by_id(self, customer_id: str) -> Dict[str, Any]:
        """Pulls pre-prediction features for a customer ID directly from DuckDB and infers risk."""
        con = self.fe.db_path
        raw_df = self.fe.extract_raw_features()
        cust_row = raw_df[raw_df["customer_id"] == customer_id]

        if cust_row.empty:
            raise ValueError(f"Customer ID '{customer_id}' not found in database.")

        res = self.predict_features(cust_row)
        res["customer_id"] = customer_id
        res["customer_name"] = str(cust_row.get("full_name", [customer_id]).iloc[0]) if "full_name" in cust_row else customer_id
        res["plan_tier"] = str(cust_row["plan_tier"].iloc[0])
        res["monthly_price"] = float(cust_row["monthly_price"].iloc[0])
        return res


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Customer360 Churn Inference CLI")
    parser.add_argument("--customer_id", type=str, default="CUST-00516", help="Customer ID to predict")
    args = parser.parse_args()

    predictor = ChurnPredictor()
    prediction = predictor.predict_customer_by_id(args.customer_id)
    print("=" * 60)
    print(f"CUSTOMER360 INFERENCE RESULT: {args.customer_id}")
    print("=" * 60)
    print(f"Churn Probability: {prediction['churn_probability_pct']}% ({prediction['risk_tier']} Risk)")
    print("\nTop Risk Factors (Pushing Toward Churn):")
    for r in prediction["top_risk_factors"]:
        print(f"  ▲ {r['feature']:<30} (SHAP: +{r['shap_value']:.4f})")
    print("\nTop Protective Factors (Pushing Toward Retention):")
    for p in prediction["top_protective_factors"]:
        print(f"  ▼ {p['feature']:<30} (SHAP: {p['shap_value']:.4f})")
