WITH transactions AS (
    SELECT * FROM {{ ref('stg_transactions') }}
),

subscriptions AS (
    SELECT * FROM {{ ref('customer_subscription_history') }}
    WHERE subscription_recency_rank = 1
),

customer_spend AS (
    SELECT
        t.customer_id,
        COUNT(t.transaction_id) AS total_invoices_billed,
        SUM(CASE WHEN t.payment_status = 'succeeded' THEN 1 ELSE 0 END) AS successful_invoices_count,
        SUM(CASE WHEN t.payment_status = 'failed' THEN 1 ELSE 0 END) AS failed_invoices_count,
        SUM(CASE WHEN t.payment_status = 'succeeded' THEN t.amount ELSE 0 END) AS total_realized_revenue,
        MIN(t.transaction_date) AS customer_first_payment_date,
        MAX(t.transaction_date) AS customer_last_payment_date
    FROM transactions t
    GROUP BY t.customer_id
)

SELECT
    cs.customer_id,
    s.plan_name,
    s.plan_tier,
    s.contract_type,
    s.subscription_status,
    s.monthly_price,
    ROUND(s.monthly_price * 12.0, 2) AS current_arr,
    cs.total_invoices_billed,
    cs.successful_invoices_count,
    cs.failed_invoices_count,
    cs.total_realized_revenue,
    cs.customer_first_payment_date,
    cs.customer_last_payment_date,
    -- Window function: Customer Revenue Ranking across platform
    DENSE_RANK() OVER (ORDER BY cs.total_realized_revenue DESC) AS revenue_rank,
    PERCENT_RANK() OVER (ORDER BY cs.total_realized_revenue) AS revenue_percentile,
    -- Top Tier Customer classification
    CASE 
        WHEN DENSE_RANK() OVER (ORDER BY cs.total_realized_revenue DESC) <= 50 THEN 'Top 50'
        WHEN DENSE_RANK() OVER (ORDER BY cs.total_realized_revenue DESC) <= 200 THEN 'Top 200'
        ELSE 'General'
    END AS customer_revenue_tier
FROM customer_spend cs
LEFT JOIN subscriptions s ON cs.customer_id = s.customer_id
