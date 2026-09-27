"""
Customer360 - Churn Prediction Framework & Problem Formulation
==============================================================
Production-grade definitions preventing target leakage.

1. PROBLEM FORMULATION:
   A supervised binary classification model that predicts the probability that an
   active customer will churn (cancel their subscription) during a specified forward-looking
   prediction window [T_pred, T_pred + Δt].

2. TEMPORAL BOUNDARIES:
   - PREDICTION DATE (T_pred):
     The exact cutoff timestamp separating feature calculation from target observation.
     In this dataset, we benchmark features prior to the final active observation period.
   - OBSERVATION WINDOW:
     The historical lookback horizon [T_pred - 90 days, T_pred] (and all historical
     invoicing/tenure data up to T_pred). Features evaluate engagement velocity, payment
     patterns, and support tickets strictly occurring BEFORE or AT T_pred.
   - PREDICTION WINDOW (Δt):
     60 days forward [T_pred, T_pred + 60 days]. This window aligns with B2B SaaS operational
     cadence (allowing customer success teams sufficient lead time to intervene before renewal).

3. TARGET VARIABLE (y):
   y_i ∈ {0, 1}
   - y = 1 (CHURN): Customer terminated subscription within [T_pred, T_pred + 60 days]
     or entered unrecovered payment cancellation.
   - y = 0 (RETAINED): Customer remained active with paid subscription at T_pred + 60 days.

4. TARGET LEAKAGE PREVENTION MANIFESTO:
   - FORBIDDEN IN FEATURE SPACE:
     * Any field containing the word 'churn' (churn_date, churn_reason, churn_feedback, churn_type).
     * Any transaction, invoice, or payment dated AFTER T_pred.
     * Any session, login, or feature event logged AFTER T_pred.
     * Any support ticket submitted AFTER T_pred.
     * Current subscription status (e.g. status='cancelled') which leaks the outcome directly.
   - PERMITTED IN FEATURE SPACE:
     * Demographics and acquisition attributes known at signup.
     * Contract and plan terms active at T_pred.
     * Historical tenure elapsed up to T_pred.
     * Aggregate session counts, duration, and feature usage recorded BEFORE T_pred.
     * Support ticket volume and CSAT scores recorded BEFORE T_pred.
     * Invoicing history and failed payment counts recorded BEFORE T_pred.
"""

from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class ChurnPredictionConfig:
    observation_window_days: int = 90
    prediction_window_days: int = 60
    target_column: str = "is_churned"
    
    # Strictly prohibited features due to target leakage
    leakage_blacklist: List[str] = (
        "churn_date",
        "churn_reason",
        "churn_feedback",
        "churn_type",
        "is_churned",
        "customer_status",
        "subscription_status",
        "dbt_updated_at",
        "first_name",
        "last_name",
        "full_name",
        "email"
    )

    # Core permitted feature domains
    demographic_features: List[str] = (
        "age",
        "gender",
        "country",
        "region",
        "acquisition_channel"
    )

    contract_features: List[str] = (
        "plan_tier",
        "contract_type",
        "current_mrr",
        "tenure_months"
    )

    engagement_features: List[str] = (
        "total_sessions",
        "total_session_minutes",
        "avg_session_minutes",
        "total_logins",
        "distinct_features_used",
        "total_active_days",
        "is_engagement_declining"
    )

    support_features: List[str] = (
        "total_tickets_count",
        "high_urgency_tickets_count",
        "avg_resolution_hours",
        "avg_satisfaction_score",
        "has_support_friction"
    )

    financial_features: List[str] = (
        "lifetime_billed_revenue",
        "total_invoices_count",
        "failed_transactions_count",
        "has_payment_delinquency"
    )


CONFIG = ChurnPredictionConfig()
