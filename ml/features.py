"""
Customer360 - Feature Engineering Pipeline
===========================================
Extracts clean, non-leaking features from the data foundation layer
and builds scikit-learn compatible transformation pipelines.
"""

import os
import duckdb
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed/customer360.duckdb"))


class FeatureEngineer:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        
        # Categorical columns
        self.categorical_features = [
            "contract_type",
            "plan_tier",
            "acquisition_channel",
            "country",
            "gender"
        ]
        
        # Numerical columns
        self.numerical_features = [
            "tenure_months",
            "tenure_days",
            "monthly_price",
            "historical_revenue",
            "total_invoices_count",
            "failed_transactions_count",
            "payment_failure_rate",
            "has_payment_delinquency",
            "total_sessions",
            "total_session_minutes",
            "avg_session_minutes",
            "total_logins",
            "login_frequency_per_month",
            "session_frequency_per_month",
            "distinct_features_used",
            "total_active_days",
            "active_day_ratio",
            "is_engagement_declining",
            "recency_days",
            "total_tickets_count",
            "high_urgency_tickets_count",
            "urgent_ticket_ratio",
            "avg_resolution_hours",
            "avg_satisfaction_score",
            "has_support_friction",
            "age"
        ]

    def extract_raw_features(self) -> pd.DataFrame:
        """
        Extracts feature attributes from DuckDB with strict leakage prevention.
        NO churn dates, feedback, reasons, or status flags permitted.
        """
        con = duckdb.connect(self.db_path, read_only=True)
        query = """
        SELECT 
            c.customer_id,
            -- Target variable
            CASE WHEN c.is_churned THEN 1 ELSE 0 END AS is_churned,
            
            -- Tenure & Contract features
            c.tenure_months,
            c.tenure_days,
            c.contract_type,
            c.plan_tier,
            c.current_mrr AS monthly_price,
            
            -- Historical Financials & Payment Stability
            c.lifetime_billed_revenue AS historical_revenue,
            c.total_invoices_count,
            c.failed_transactions_count,
            CASE WHEN c.has_payment_delinquency THEN 1 ELSE 0 END AS has_payment_delinquency,
            ROUND(CAST(c.failed_transactions_count AS DOUBLE) / NULLIF(c.total_invoices_count, 0), 4) AS payment_failure_rate,
            
            -- Engagement & Telemetry (strictly pre-prediction)
            c.total_sessions,
            c.total_session_minutes,
            c.avg_session_minutes,
            c.total_logins,
            ROUND(CAST(c.total_logins AS DOUBLE) / NULLIF(c.tenure_months, 0), 2) AS login_frequency_per_month,
            ROUND(CAST(c.total_sessions AS DOUBLE) / NULLIF(c.tenure_months, 0), 2) AS session_frequency_per_month,
            c.distinct_features_used,
            c.total_active_days,
            ROUND(CAST(c.total_active_days AS DOUBLE) / NULLIF(c.tenure_days, 0), 4) AS active_day_ratio,
            CASE WHEN c.is_engagement_declining THEN 1 ELSE 0 END AS is_engagement_declining,
            COALESCE(s.recency_days, 30) AS recency_days,
            
            -- Customer Support & Friction
            c.total_tickets_count,
            c.high_urgency_tickets_count,
            ROUND(CAST(c.high_urgency_tickets_count AS DOUBLE) / NULLIF(c.total_tickets_count, 0), 4) AS urgent_ticket_ratio,
            c.avg_resolution_hours,
            c.avg_satisfaction_score,
            CASE WHEN c.has_support_friction THEN 1 ELSE 0 END AS has_support_friction,
            
            -- Demographics & Attribution
            c.acquisition_channel,
            c.country,
            c.age,
            c.gender
        FROM main_marts.mart_customer_360 c
        LEFT JOIN main_marts.mart_customer_segments s ON c.customer_id = s.customer_id
        ORDER BY c.customer_id;
        """
        df = con.execute(query).df()
        con.close()
        
        # Fill potential ratio division nulls
        df["payment_failure_rate"] = df["payment_failure_rate"].fillna(0.0)
        df["login_frequency_per_month"] = df["login_frequency_per_month"].fillna(0.0)
        df["session_frequency_per_month"] = df["session_frequency_per_month"].fillna(0.0)
        df["active_day_ratio"] = df["active_day_ratio"].fillna(0.0)
        df["urgent_ticket_ratio"] = df["urgent_ticket_ratio"].fillna(0.0)
        
        return df

    def get_preprocessor(self) -> ColumnTransformer:
        """Builds a scikit-learn ColumnTransformer for numerical and categorical features."""
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", num_pipeline, self.numerical_features),
                ("cat", cat_pipeline, self.categorical_features)
            ],
            remainder="drop"
        )
        return preprocessor

    def prepare_data(self) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """Prepares feature matrix X and target vector y."""
        raw_df = self.extract_raw_features()
        y = raw_df["is_churned"].astype(int)
        
        feature_cols = self.numerical_features + self.categorical_features
        X = raw_df[feature_cols].copy()
        
        return X, y, feature_cols


if __name__ == "__main__":
    fe = FeatureEngineer()
    X, y, cols = fe.prepare_data()
    print("Feature Extraction Succeeded.")
    print(f"X shape: {X.shape}, y distribution: {y.value_counts().to_dict()}")
    print(f"Numerical features ({len(fe.numerical_features)}): {fe.numerical_features[:5]}...")
    print(f"Categorical features ({len(fe.categorical_features)}): {fe.categorical_features}")
