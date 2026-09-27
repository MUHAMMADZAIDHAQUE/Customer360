WITH customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

subscriptions AS (
    SELECT * FROM {{ ref('customer_subscription_history') }}
    WHERE subscription_recency_rank = 1
),

cohort_base AS (
    SELECT
        c.customer_id,
        CAST(DATE_TRUNC('month', c.signup_date) AS DATE) AS cohort_month,
        c.signup_date,
        s.start_date,
        s.end_date,
        s.monthly_price,
        s.is_churned,
        s.churn_date
    FROM customers c
    JOIN subscriptions s ON c.customer_id = s.customer_id
),

cohort_sizes AS (
    SELECT
        cohort_month,
        COUNT(DISTINCT customer_id) AS cohort_size,
        SUM(monthly_price) AS cohort_starting_mrr
    FROM cohort_base
    GROUP BY cohort_month
),

-- Generate observation months (Months 0 through 12)
month_indices AS (
    SELECT unnest([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) AS month_number
),

cohort_activity AS (
    SELECT
        b.cohort_month,
        m.month_number,
        COUNT(DISTINCT CASE 
            WHEN b.is_churned = FALSE THEN b.customer_id
            -- Customer was still active during this observation month
            WHEN DATE_DIFF('month', b.cohort_month, CAST(DATE_TRUNC('month', b.churn_date) AS DATE)) >= m.month_number THEN b.customer_id
            ELSE NULL 
        END) AS retained_customers_count,
        SUM(CASE 
            WHEN b.is_churned = FALSE THEN b.monthly_price
            WHEN DATE_DIFF('month', b.cohort_month, CAST(DATE_TRUNC('month', b.churn_date) AS DATE)) >= m.month_number THEN b.monthly_price
            ELSE 0.0 
        END) AS retained_mrr
    FROM cohort_base b
    CROSS JOIN month_indices m
    -- Filter out future months relative to our simulation end date (2026-09-01)
    WHERE DATE_DIFF('month', b.cohort_month, CAST('2026-09-01' AS DATE)) >= m.month_number
    GROUP BY b.cohort_month, m.month_number
)

SELECT
    a.cohort_month,
    s.cohort_size,
    s.cohort_starting_mrr,
    a.month_number,
    a.retained_customers_count,
    ROUND(a.retained_customers_count * 100.0 / NULLIF(s.cohort_size, 0), 2) AS retention_rate_pct,
    -- Churn rate formula: 100 - retention_rate
    ROUND(100.0 - (a.retained_customers_count * 100.0 / NULLIF(s.cohort_size, 0)), 2) AS cumulative_churn_rate_pct,
    ROUND(a.retained_mrr, 2) AS retained_mrr,
    ROUND(a.retained_mrr * 100.0 / NULLIF(s.cohort_starting_mrr, 0), 2) AS mrr_retention_rate_pct
FROM cohort_activity a
JOIN cohort_sizes s ON a.cohort_month = s.cohort_month
ORDER BY a.cohort_month ASC, a.month_number ASC
