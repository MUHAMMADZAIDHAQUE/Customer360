"""
Customer360 SQLAlchemy Declarative ORM Models
=============================================
Maps to PostgreSQL schema 'customer360' and provides structured relational definitions.
"""

from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class CustomerORM(Base):
    __tablename__ = "customers"
    __table_args__ = {"schema": "customer360"}

    customer_id = Column(String(50), primary_key=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    gender = Column(String(20))
    age = Column(Integer)
    country = Column(String(100), nullable=False)
    region = Column(String(100))
    city = Column(String(100))
    postal_code = Column(String(20))
    signup_date = Column(Date, nullable=False)
    acquisition_channel = Column(String(50), nullable=False)
    customer_status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscriptions = relationship("SubscriptionORM", back_populates="customer")
    transactions = relationship("TransactionORM", back_populates="customer")
    support_tickets = relationship("SupportTicketORM", back_populates="customer")


class PlanORM(Base):
    __tablename__ = "plans"
    __table_args__ = {"schema": "customer360"}

    plan_id = Column(String(50), primary_key=True)
    plan_name = Column(String(100), nullable=False)
    tier = Column(String(50), nullable=False)
    monthly_price = Column(Numeric(10, 2), nullable=False)
    annual_price = Column(Numeric(10, 2), nullable=False)
    max_seats = Column(Integer, default=1)
    features_included = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    subscriptions = relationship("SubscriptionORM", back_populates="plan")


class SubscriptionORM(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "customer360"}

    subscription_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey("customer360.customers.customer_id"), nullable=False)
    plan_id = Column(String(50), ForeignKey("customer360.plans.plan_id"), nullable=False)
    contract_type = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    renewal_date = Column(Date)
    monthly_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="active", nullable=False)
    auto_renew = Column(Boolean, default=True)
    cancellation_date = Column(Date)
    cancellation_reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("CustomerORM", back_populates="subscriptions")
    plan = relationship("PlanORM", back_populates="subscriptions")


class TransactionORM(Base):
    __tablename__ = "transactions"
    __table_args__ = {"schema": "customer360"}

    transaction_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey("customer360.customers.customer_id"), nullable=False)
    subscription_id = Column(String(50), nullable=False)
    transaction_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    payment_status = Column(String(20), nullable=False)
    payment_method = Column(String(50))
    invoice_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("CustomerORM", back_populates="transactions")


class SupportTicketORM(Base):
    __tablename__ = "support_tickets"
    __table_args__ = {"schema": "customer360"}

    ticket_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey("customer360.customers.customer_id"), nullable=False)
    created_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime)
    category = Column(String(100), nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    resolution_time_hours = Column(Numeric(8, 2))
    satisfaction_score = Column(Integer)
    is_escalated = Column(Boolean, default=False)

    customer = relationship("CustomerORM", back_populates="support_tickets")


class ChurnEventORM(Base):
    __tablename__ = "churn_events"
    __table_args__ = {"schema": "customer360"}

    churn_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), nullable=False)
    subscription_id = Column(String(50), nullable=False)
    churn_date = Column(Date, nullable=False)
    churn_reason = Column(String(100), nullable=False)
    churn_type = Column(String(50), nullable=False)
    feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
