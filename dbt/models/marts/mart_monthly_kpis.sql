WITH calendar_months AS (
    SELECT DISTINCT CAST(DATE_TRUNC('month', signup_date) AS DATE) AS observation_month
    FROM {{ ref('stg_customers') }}
),

customer_base AS (
    SELECT * FROM {{ ref('mart_customer_360') }}
),

transactions AS (
    SELECT * FROM {{ ref('stg_transactions') }}
),

monthly_activity AS (
    SELECT
        m.observation_month,
        -- New customer acquisitions during this calendar month
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', c.signup_date) = m.observation_month THEN c.customer_id END) AS new_signups_count,
        -- Churn departures during this calendar month
        COUNT(DISTINCT CASE WHEN c.is_churned AND DATE_TRUNC('month', c.churn_date) = m.observation_month THEN c.customer_id END) AS churned_customers_count,
        -- Active paying customers during this month
        COUNT(DISTINCT CASE 
            WHEN c.signup_date <= m.observation_month AND (c.is_churned = FALSE OR c.churn_date > m.observation_month) 
            THEN c.customer_id 
        END) AS active_customers_count,
        -- Active MRR
        SUM(CASE 
            WHEN c.signup_date <= m.observation_month AND (c.is_churned = FALSE OR c.churn_date > m.observation_month) 
            THEN c.current_mrr 
            ELSE 0 
        END) AS active_mrr,
        -- Revenue at risk
        SUM(CASE 
            WHEN c.signup_date <= m.observation_month AND (c.is_churned = FALSE OR c.churn_date > m.observation_month) AND c.is_at_risk = TRUE 
            THEN c.current_arr 
            ELSE 0 
        END) AS revenue_at_risk
    FROM calendar_months m
    CROSS JOIN customer_base c
    GROUP BY m.observation_month
),

monthly_cash AS (
    SELECT
        CAST(DATE_TRUNC('month', transaction_date) AS DATE) AS transaction_month,
        SUM(CASE WHEN payment_status = 'succeeded' THEN amount ELSE 0 END) AS cash_collected,
        COUNT(transaction_id) AS invoices_billed_count
    FROM transactions
    GROUP BY CAST(DATE_TRUNC('month', transaction_date) AS DATE)
)

SELECT
    a.observation_month,
    a.active_customers_count,
    a.new_signups_count,
    a.churned_customers_count,
    (a.new_signups_count - a.churned_customers_count) AS net_customer_growth,
    -- Canonical Monthly Churn Rate: Churned / Active Start-of-period
    ROUND(
        a.churned_customers_count * 100.0 / 
        NULLIF(a.active_customers_count, 0), 2
    ) AS monthly_churn_rate_pct,
    -- Canonical Retention Rate: 100 - Churn Rate
    ROUND(
        100.0 - (a.churned_customers_count * 100.0 / NULLIF(a.active_customers_count, 0)), 2
    ) AS monthly_retention_rate_pct,
    ROUND(a.active_mrr, 2) AS active_mrr,
    -- Canonical ARR = MRR * 12
    ROUND(a.active_mrr * 12.0, 2) AS active_arr,
    -- Canonical ARPU = Active MRR / Active Customers
    ROUND(
        a.active_mrr * 1.0 / NULLIF(a.active_customers_count, 0), 2
    ) AS arpu,
    ROUND(a.revenue_at_risk, 2) AS revenue_at_risk,
    COALESCE(c.cash_collected, 0.0) AS cash_collected,
    COALESCE(c.invoices_billed_count, 0) AS invoices_billed_count
FROM monthly_activity a
LEFT JOIN monthly_cash c ON a.observation_month = c.transaction_month
ORDER BY a.observation_month ASC
