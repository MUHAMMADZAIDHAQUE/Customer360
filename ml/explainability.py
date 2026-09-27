"""
Customer360 - SHAP Explainability Engine
========================================
Implements:
1. Global Feature Importance (TreeExplainer + Beeswarm/Bar plots)
2. Individual Customer Explanations:
   - Churn Probability
   - Top Risk Factors (positive SHAP values pushing toward churn)
   - Top Protective Factors (negative SHAP values pushing toward retention)
3. Batch Scoring and Pre-computed Explanation Cache for API/UI.
"""

import os
import json
import joblib
import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, List, Any
import sys
ml_dir = os.path.dirname(os.path.abspath(__file__))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

try:
    from ml.features import FeatureEngineer
except ImportError:
    from features import FeatureEngineer

ARTIFACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))
FIG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../reports/figures"))


class ChurnExplainer:
    def __init__(self, model_path: str = None):
        if model_path is None:
            model_path = os.path.join(ARTIFACT_DIR, "best_churn_model.joblib")
        
        self.pipeline = joblib.load(model_path)
        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.classifier = self.pipeline.named_steps["classifier"]
        self.fe = FeatureEngineer()

        # Clean feature names from preprocessor
        self.feature_names = self._extract_feature_names()
        
        # Initialize SHAP TreeExplainer on preprocessed background
        self.explainer = shap.TreeExplainer(self.classifier)

    def _extract_feature_names(self) -> List[str]:
        """Extracts human-readable feature names post-one-hot encoding."""
        try:
            raw_names = self.preprocessor.get_feature_names_out()
            clean_names = []
            for name in raw_names:
                clean = name.replace("num__", "").replace("cat__", "")
                clean_names.append(clean)
            return clean_names
        except Exception:
            # Fallback
            cat_encoder = self.preprocessor.named_transformers_["cat"].named_steps["onehot"]
            cat_encoded = cat_encoder.get_feature_names_out(self.fe.categorical_features)
            clean_cats = [c.replace("cat__", "") for c in cat_encoded]
            return self.fe.numerical_features + clean_cats

    def _preprocess_X(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms raw input dataframe into scaled/encoded matrix."""
        return self.preprocessor.transform(X)

    def compute_global_importance(self, X: pd.DataFrame, max_display: int = 15) -> dict:
        """Computes global mean |SHAP| feature importance and saves plots."""
        X_trans = self._preprocess_X(X)
        shap_values = self.explainer.shap_values(X_trans)

        # For binary classifier, shap_values can be shape (N, D) or list of 2 arrays
        if isinstance(shap_values, list):
            sv = shap_values[1]  # positive class (churn)
        elif len(shap_values.shape) == 3:
            sv = shap_values[:, :, 1]
        else:
            sv = shap_values

        mean_abs_shap = np.mean(np.abs(sv), axis=0)
        importance_df = pd.DataFrame({
            "feature": self.feature_names,
            "mean_abs_shap": mean_abs_shap
        }).sort_values(by="mean_abs_shap", ascending=False)

        # Plot global importance bar chart
        plt.figure(figsize=(10, 8), dpi=300)
        top_df = importance_df.head(max_display).sort_values(by="mean_abs_shap", ascending=True)
        plt.barh(top_df["feature"], top_df["mean_abs_shap"], color="#1e3a8a", edgecolor="#0f172a")
        plt.title("Customer360 - Global SHAP Feature Importance Ranking", fontsize=14, fontweight="bold")
        plt.xlabel("Mean |SHAP Value| (Impact on Model Churn Prediction)", fontsize=11)
        plt.tight_layout()
        
        bar_png = os.path.join(FIG_DIR, "shap_global_importance.png")
        plt.savefig(bar_png, dpi=300)
        plt.close()

        # Save JSON
        importance_json_path = os.path.join(ARTIFACT_DIR, "global_feature_importance.json")
        with open(importance_json_path, "w") as f:
            json.dump(importance_df.to_dict(orient="records"), f, indent=2)

        return {
            "importance_ranking": importance_df.to_dict(orient="records"),
            "plot_path": bar_png
        }

    def explain_single_customer(self, customer_features: pd.DataFrame, top_k: int = 4) -> dict:
        """
        Produces local SHAP attribution for a single customer record:
        - Churn Probability
        - Top Risk Factors (pushing toward churn)
        - Top Protective Factors (pushing toward retention)
        """
        X_trans = self._preprocess_X(customer_features)
        prob = float(self.classifier.predict_proba(X_trans)[0, 1])
        
        shap_vals = self.explainer.shap_values(X_trans)
        if isinstance(shap_vals, list):
            sv = shap_vals[1][0]
        elif len(shap_vals.shape) == 3:
            sv = shap_vals[0, :, 1]
        else:
            sv = shap_vals[0]

        factors = []
        for feat_name, val in zip(self.feature_names, sv):
            factors.append({
                "feature": feat_name,
                "shap_value": round(float(val), 4)
            })

        # Separate risk vs protective
        risk_factors = sorted([f for f in factors if f["shap_value"] > 0], key=lambda x: x["shap_value"], reverse=True)[:top_k]
        protective_factors = sorted([f for f in factors if f["shap_value"] < 0], key=lambda x: x["shap_value"])[:top_k]

        # Categorize risk tier
        if prob >= 0.75:
            tier = "Critical"
        elif prob >= 0.50:
            tier = "High"
        elif prob >= 0.25:
            tier = "Medium"
        else:
            tier = "Low"

        return {
            "churn_probability": round(prob, 4),
            "churn_probability_pct": round(prob * 100.0, 2),
            "risk_tier": tier,
            "top_risk_factors": risk_factors,
            "top_protective_factors": protective_factors
        }

    def explain_and_score_all_customers(self) -> pd.DataFrame:
        """
        Scores all active customers in the database and produces complete
        explanations for instant API retrieval.
        """
        raw_df = self.fe.extract_raw_features()
        cust_ids = raw_df["customer_id"].tolist()
        feature_cols = self.fe.numerical_features + self.fe.categorical_features
        X = raw_df[feature_cols].copy()

        X_trans = self._preprocess_X(X)
        probs = self.classifier.predict_proba(X_trans)[:, 1]
        
        shap_vals = self.explainer.shap_values(X_trans)
        if isinstance(shap_vals, list):
            sv_mat = shap_vals[1]
        elif len(shap_vals.shape) == 3:
            sv_mat = shap_vals[:, :, 1]
        else:
            sv_mat = shap_vals

        predictions = []
        for i, cid in enumerate(cust_ids):
            prob = float(probs[i])
            sv = sv_mat[i]

            factors = [{"feature": f, "shap": float(v)} for f, v in zip(self.feature_names, sv)]
            risks = sorted([f for f in factors if f["shap"] > 0], key=lambda x: x["shap"], reverse=True)[:3]
            protects = sorted([f for f in factors if f["shap"] < 0], key=lambda x: x["shap"])[:3]

            if prob >= 0.75:
                tier = "Critical"
            elif prob >= 0.50:
                tier = "High"
            elif prob >= 0.25:
                tier = "Medium"
            else:
                tier = "Low"

            predictions.append({
                "customer_id": cid,
                "is_churned_actual": int(raw_df["is_churned"].iloc[i]),
                "churn_probability": round(prob, 4),
                "risk_tier": tier,
                "primary_risk_factor": risks[0]["feature"] if risks else "none",
                "primary_risk_shap": round(risks[0]["shap"], 4) if risks else 0.0,
                "top_risk_factors": json.dumps(risks),
                "top_protective_factors": json.dumps(protects)
            })

        pred_df = pd.DataFrame(predictions)
        
        # Save cache
        pred_parquet = os.path.join(ARTIFACT_DIR, "customer_churn_predictions.parquet")
        pred_json = os.path.join(ARTIFACT_DIR, "customer_churn_predictions.json")
        pred_df.to_parquet(pred_parquet)
        pred_df.head(200).to_json(pred_json, orient="records", indent=2)

        print(f"✓ Scored and explained {len(pred_df)} customer accounts.")
        print(f"✓ Persisted predictions cache to: {pred_parquet}")
        return pred_df


if __name__ == "__main__":
    explainer = ChurnExplainer()
    fe = FeatureEngineer()
    X, y, cols = fe.prepare_data()

    print("Computing global SHAP feature importance...")
    global_res = explainer.compute_global_importance(X)
    print("Top 5 Global Drivers:")
    for row in global_res["importance_ranking"][:5]:
        print(f"  {row['feature']:<30} | Mean |SHAP|: {row['mean_abs_shap']:.4f}")

    print("\nScoring and explaining all customer accounts...")
    pred_df = explainer.explain_and_score_all_customers()
    print("Risk Tier Distribution:\n", pred_df["risk_tier"].value_counts())
