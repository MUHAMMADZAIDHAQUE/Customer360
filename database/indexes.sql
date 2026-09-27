-- ==============================================================================
-- Customer360 - PostgreSQL Performance Indexes
-- ==============================================================================

SET search_path TO customer360, public;

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_signup_date ON customers (signup_date);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_channel ON customers (acquisition_channel);
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers (country);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions (customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contract ON subscriptions (contract_type);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON transactions (subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (payment_status);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

-- Support Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON support_tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_category_priority ON support_tickets (category, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_satisfaction ON support_tickets (satisfaction_score);

-- Customer Engagement
CREATE INDEX IF NOT EXISTS idx_engagement_customer_id ON customer_engagement (customer_id);
CREATE INDEX IF NOT EXISTS idx_engagement_date ON customer_engagement (date);
CREATE INDEX IF NOT EXISTS idx_engagement_cust_date ON customer_engagement (customer_id, date);

-- Product Usage
CREATE INDEX IF NOT EXISTS idx_usage_customer_id ON product_usage (customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON product_usage (date);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON product_usage (feature_name);

-- Churn Events
CREATE INDEX IF NOT EXISTS idx_churn_customer_id ON churn_events (customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_subscription_id ON churn_events (subscription_id);
CREATE INDEX IF NOT EXISTS idx_churn_date ON churn_events (churn_date);
CREATE INDEX IF NOT EXISTS idx_churn_reason ON churn_events (churn_reason);
