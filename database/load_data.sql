-- ==============================================================================
-- Customer360 - PostgreSQL Bulk Ingest Script
-- Loads raw CSV data into customer360 relational schema
-- ==============================================================================

SET search_path TO customer360, public;

-- Disable triggers/constraints for high-speed ingest if necessary
-- Note: Replace absolute paths with local deployment directory

\copy plans FROM 'data/raw/plans.csv' WITH (FORMAT csv, HEADER true);
\copy customers FROM 'data/raw/customers.csv' WITH (FORMAT csv, HEADER true);
\copy subscriptions FROM 'data/raw/subscriptions.csv' WITH (FORMAT csv, HEADER true);
\copy transactions FROM 'data/raw/transactions.csv' WITH (FORMAT csv, HEADER true);
\copy payments FROM 'data/raw/payments.csv' WITH (FORMAT csv, HEADER true);
\copy support_tickets FROM 'data/raw/support_tickets.csv' WITH (FORMAT csv, HEADER true);
\copy customer_engagement FROM 'data/raw/customer_engagement.csv' WITH (FORMAT csv, HEADER true);
\copy product_usage FROM 'data/raw/product_usage.csv' WITH (FORMAT csv, HEADER true);
\copy churn_events FROM 'data/raw/churn_events.csv' WITH (FORMAT csv, HEADER true);

-- Verify counts
SELECT 'plans' AS table_name, count(*) FROM plans
UNION ALL
SELECT 'customers', count(*) FROM customers
UNION ALL
SELECT 'subscriptions', count(*) FROM subscriptions
UNION ALL
SELECT 'transactions', count(*) FROM transactions
UNION ALL
SELECT 'payments', count(*) FROM payments
UNION ALL
SELECT 'support_tickets', count(*) FROM support_tickets
UNION ALL
SELECT 'customer_engagement', count(*) FROM customer_engagement
UNION ALL
SELECT 'product_usage', count(*) FROM product_usage
UNION ALL
SELECT 'churn_events', count(*) FROM churn_events;
