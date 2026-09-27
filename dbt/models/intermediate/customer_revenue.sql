WITH transactions AS (
    SELECT * FROM {{ ref('stg_transactions') }}
),

subscriptions AS (
    SELECT * FROM {{ ref('stg_subscriptions') }}
),

tx_summary AS (
    SELECT
        customer_id,
        MIN(transaction_date) AS first_transaction_date,
        MAX(transaction_date) AS last_transaction_date,
        COUNT(transaction_id) AS total_invoices_count,
        SUM(CASE WHEN payment_status = 'succeeded' THEN 1 ELSE 0 END) AS successful_transactions_count,
        SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) AS failed_transactions_count,
        -- Realized Lifetime Revenue (CLV historical component)
        COALESCE(SUM(CASE WHEN payment_status = 'succeeded' THEN amount ELSE 0 END), 0) AS lifetime_billed_revenue,
        -- Recent failed transactions (trailing 60 days)
        SUM(CASE WHEN payment_status = 'failed' AND transaction_day >= '2026-07-01' THEN 1 ELSE 0 END) AS recent_failed_transactions_count
    FROM transactions
    GROUP BY customer_id
),

active_sub AS (
    SELECT
        customer_id,
        monthly_price AS current_mrr,
        (monthly_price * 12.0) AS current_arr
    FROM subscriptions
    WHERE status = 'active'
)

SELECT
    COALESCE(t.customer_id, s.customer_id) AS customer_id,
    t.first_transaction_date,
    t.last_transaction_date,
    COALESCE(t.total_invoices_count, 0) AS total_invoices_count,
    COALESCE(t.successful_transactions_count, 0) AS successful_transactions_count,
    COALESCE(t.failed_transactions_count, 0) AS failed_transactions_count,
    COALESCE(t.lifetime_billed_revenue, 0.0) AS lifetime_billed_revenue,
    COALESCE(s.current_mrr, 0.0) AS current_mrr,
    COALESCE(s.current_arr, 0.0) AS current_arr,
    COALESCE(t.recent_failed_transactions_count, 0) AS recent_failed_transactions_count,
    CASE WHEN COALESCE(t.recent_failed_transactions_count, 0) > 0 THEN TRUE ELSE FALSE END AS has_payment_delinquency
FROM tx_summary t
FULL OUTER JOIN active_sub s ON t.customer_id = s.customer_id
