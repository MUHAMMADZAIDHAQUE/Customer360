-- ==============================================================================
-- Customer360 - Database DDL Schema (PostgreSQL 16)
-- AI-Powered Customer Intelligence & Retention Platform
-- ==============================================================================

-- Create application schema
CREATE SCHEMA IF NOT EXISTS customer360;
SET search_path TO customer360, public;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS churn_events CASCADE;
DROP TABLE IF EXISTS product_usage CASCADE;
DROP TABLE IF EXISTS customer_engagement CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- -----------------------------------------------------------------------------
-- 1. PLANS
-- -----------------------------------------------------------------------------
CREATE TABLE plans (
    plan_id VARCHAR(32) PRIMARY KEY,
    plan_name VARCHAR(64) NOT NULL,
    tier VARCHAR(32) NOT NULL, -- Starter, Professional, Enterprise
    monthly_price NUMERIC(10, 2) NOT NULL CHECK (monthly_price >= 0),
    annual_price NUMERIC(10, 2) NOT NULL CHECK (annual_price >= 0),
    max_seats INT NOT NULL DEFAULT 1 CHECK (max_seats > 0),
    features_included TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. CUSTOMERS
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    age INT CHECK (age >= 18 AND age <= 100),
    gender VARCHAR(16),
    country VARCHAR(64) NOT NULL,
    region VARCHAR(64),
    city VARCHAR(64),
    signup_date DATE NOT NULL,
    acquisition_channel VARCHAR(64) NOT NULL, -- Organic Search, Paid Ads, Referral, Social Media, Direct, Partner
    customer_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (customer_status IN ('active', 'churned', 'paused')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    subscription_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    plan_id VARCHAR(32) NOT NULL REFERENCES plans(plan_id),
    contract_type VARCHAR(32) NOT NULL CHECK (contract_type IN ('monthly', 'annual', 'multi_year')),
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_price NUMERIC(10, 2) NOT NULL CHECK (monthly_price >= 0),
    status VARCHAR(32) NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sub_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    subscription_id VARCHAR(32) REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,
    transaction_date TIMESTAMP NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('subscription_charge', 'upgrade_charge', 'refund', 'add_on')),
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('credit_card', 'paypal', 'bank_transfer', 'crypto')),
    payment_status VARCHAR(32) NOT NULL CHECK (payment_status IN ('succeeded', 'failed', 'refunded', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id VARCHAR(32) PRIMARY KEY,
    transaction_id VARCHAR(32) NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    payment_date TIMESTAMP NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(32) NOT NULL,
    payment_gateway VARCHAR(32) NOT NULL CHECK (payment_gateway IN ('stripe', 'adyen', 'braintree')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('completed', 'failed', 'declined', 'processing')),
    failure_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. SUPPORT TICKETS
-- -----------------------------------------------------------------------------
CREATE TABLE support_tickets (
    ticket_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    category VARCHAR(64) NOT NULL CHECK (category IN ('billing', 'technical_issue', 'account_access', 'feature_request', 'cancellation_request')),
    priority VARCHAR(32) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    resolution_time NUMERIC(8, 2), -- hours
    satisfaction_score INT CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5)),
    status VARCHAR(32) NOT NULL CHECK (status IN ('closed', 'resolved', 'open', 'in_progress')),
    CONSTRAINT chk_ticket_dates CHECK (resolved_at IS NULL OR resolved_at >= created_at)
);

-- -----------------------------------------------------------------------------
-- 7. CUSTOMER ENGAGEMENT
-- -----------------------------------------------------------------------------
CREATE TABLE customer_engagement (
    engagement_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions INT NOT NULL DEFAULT 0 CHECK (sessions >= 0),
    session_duration NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (session_duration >= 0), -- minutes
    logins INT NOT NULL DEFAULT 0 CHECK (logins >= 0),
    features_used INT NOT NULL DEFAULT 0 CHECK (features_used >= 0),
    active_days INT NOT NULL DEFAULT 1 CHECK (active_days >= 0 AND active_days <= 31),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_engagement_date UNIQUE (customer_id, date)
);

-- -----------------------------------------------------------------------------
-- 8. PRODUCT USAGE
-- -----------------------------------------------------------------------------
CREATE TABLE product_usage (
    usage_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    feature_name VARCHAR(64) NOT NULL CHECK (feature_name IN ('dashboard_view', 'report_export', 'api_request', 'team_collaboration', 'automated_workflow', 'ai_query')),
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    units VARCHAR(32) NOT NULL DEFAULT 'events',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. CHURN EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE churn_events (
    churn_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    subscription_id VARCHAR(32) NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
    churn_date DATE NOT NULL,
    churn_reason VARCHAR(128) NOT NULL CHECK (churn_reason IN ('price_sensitivity', 'competitor_switch', 'lack_of_features', 'poor_support', 'infrequent_use', 'payment_delinquency')),
    churn_type VARCHAR(32) NOT NULL CHECK (churn_type IN ('voluntary', 'involuntary')),
    feedback TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
