"""
Customer360 Customer Pydantic Schemas
======================================
Typed models for customer summaries, details, and search query filters.
"""

from typing import Optional, List, Dict, Any
from datetime import date
from pydantic import BaseModel, Field


class CustomerSummary(BaseModel):
    customer_id: str = Field(..., description="Unique customer identifier")
    full_name: str = Field(..., description="Customer full name")
    email: str = Field(..., description="Contact email address")
    country: str = Field(..., description="Country")
    plan_name: str = Field(..., description="Subscribed plan name")
    plan_tier: str = Field(..., description="Plan tier (Starter, Growth, Professional, Enterprise)")
    contract_type: str = Field(..., description="Contract type (monthly, annual, multi_year)")
    customer_status: str = Field(..., description="Status (active, churned)")
    is_churned: bool = Field(..., description="True if customer has churned")
    current_mrr: float = Field(..., description="Monthly Recurring Revenue in USD")
    current_arr: float = Field(..., description="Annual Run Rate in USD")
    tenure_months: float = Field(..., description="Customer tenure in months")
    total_sessions: int = Field(0, description="Total recorded sessions")
    avg_satisfaction_score: float = Field(0.0, description="Average CSAT score (1.0 - 5.0)")
    has_support_friction: bool = Field(False, description="Flag indicating support dissatisfaction")
    is_engagement_declining: bool = Field(False, description="Flag indicating 30d session drop >50%")
    risk_tier: Optional[str] = Field(None, description="ML Churn Risk Tier (Low, Medium, High, Critical)")
    churn_probability: Optional[float] = Field(None, description="Predicted ML Churn Probability (0.0 - 1.0)")


class CustomerDetail(CustomerSummary):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    signup_date: Optional[str] = None
    acquisition_channel: Optional[str] = None
    
    # Financial metrics
    lifetime_billed_revenue: float = Field(0.0, description="Cumulative realized gross cash collected")
    total_invoices_count: int = Field(0, description="Total invoices issued")
    failed_transactions_count: int = Field(0, description="Total failed payment attempts")
    has_payment_delinquency: bool = Field(False, description="Has unpaid delinquent invoices")
    
    # Engagement metrics
    total_session_minutes: float = Field(0.0, description="Total active engagement duration in minutes")
    avg_session_minutes: float = Field(0.0, description="Average duration per session in minutes")
    total_logins: int = Field(0, description="Total distinct authentication events")
    distinct_features_used: int = Field(0, description="Number of distinct product features used")
    total_active_days: int = Field(0, description="Total days with recorded usage")
    
    # Support metrics
    total_tickets_count: int = Field(0, description="Total support tickets submitted")
    high_urgency_tickets_count: int = Field(0, description="High urgency tickets count")
    avg_resolution_hours: float = Field(0.0, description="Average ticket resolution time in hours")
    
    # Churn metadata (if churned)
    churn_date: Optional[str] = None
    churn_reason: Optional[str] = None
    churn_type: Optional[str] = None
    churn_feedback: Optional[str] = None
    
    # ML Explainability
    top_risk_factors: Optional[List[Dict[str, Any]]] = None
    top_protective_factors: Optional[List[Dict[str, Any]]] = None
