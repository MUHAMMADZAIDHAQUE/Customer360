WITH subscriptions AS (
    SELECT * FROM {{ ref('stg_subscriptions') }}
),

plans AS (
    SELECT * FROM {{ ref('stg_plans') }}
),

churn AS (
    SELECT * FROM {{ ref('stg_churn_events') }}
)

SELECT
    s.subscription_id,
    s.customer_id,
    s.plan_id,
    p.plan_name,
    p.tier AS plan_tier,
    p.max_seats,
    s.contract_type,
    s.monthly_price,
    ROUND(s.monthly_price * 12.0, 2) AS annual_contract_value,
    s.start_date,
    s.end_date,
    s.status AS subscription_status,
    s.is_auto_renew,
    -- Tenure calculation
    DATE_DIFF('day', s.start_date, COALESCE(s.end_date, CAST('2026-09-01' AS DATE))) AS tenure_days,
    ROUND(DATE_DIFF('day', s.start_date, COALESCE(s.end_date, CAST('2026-09-01' AS DATE))) / 30.0, 1) AS tenure_months,
    -- Churn linkage
    CASE WHEN s.status = 'cancelled' OR c.churn_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_churned,
    c.churn_date,
    c.churn_reason,
    c.churn_type,
    c.feedback AS churn_feedback,
    -- Window function: current/latest subscription
    ROW_NUMBER() OVER (PARTITION BY s.customer_id ORDER BY s.start_date DESC) AS subscription_recency_rank
FROM subscriptions s
JOIN plans p ON s.plan_id = p.plan_id
LEFT JOIN churn c ON s.subscription_id = c.subscription_id
