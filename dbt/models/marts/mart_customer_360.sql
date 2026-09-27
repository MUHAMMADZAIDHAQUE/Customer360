WITH customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

subscription_history AS (
    SELECT * FROM {{ ref('customer_subscription_history') }}
    WHERE subscription_recency_rank = 1
),

revenue AS (
    SELECT * FROM {{ ref('customer_revenue') }}
),

activity AS (
    SELECT * FROM {{ ref('customer_activity') }}
),

support AS (
    SELECT * FROM {{ ref('customer_support') }}
)

SELECT
    -- 1. Identity & Demographics
    c.customer_id,
    c.first_name,
    c.last_name,
    c.full_name,
    c.email,
    c.age,
    c.gender,
    c.country,
    c.region,
    c.city,
    c.signup_date,
    c.acquisition_channel,
    c.customer_status,

    -- 2. Subscription Details
    s.subscription_id,
    s.plan_id,
    s.plan_name,
    s.plan_tier,
    s.max_seats,
    s.contract_type,
    s.subscription_status,
    s.start_date AS subscription_start_date,
    s.end_date AS subscription_end_date,
    s.tenure_days,
    s.tenure_months,

    -- 3. Commercial & Recurring Revenue
    COALESCE(r.current_mrr, 0.0) AS current_mrr,
    COALESCE(r.current_arr, 0.0) AS current_arr,
    COALESCE(r.lifetime_billed_revenue, 0.0) AS lifetime_billed_revenue,
    COALESCE(r.total_invoices_count, 0) AS total_invoices_count,
    COALESCE(r.failed_transactions_count, 0) AS failed_transactions_count,
    COALESCE(r.has_payment_delinquency, FALSE) AS has_payment_delinquency,

    -- 4. Activity & Engagement
    COALESCE(a.total_sessions, 0) AS total_sessions,
    COALESCE(a.total_session_minutes, 0.0) AS total_session_minutes,
    COALESCE(a.avg_session_minutes, 0.0) AS avg_session_minutes,
    COALESCE(a.total_logins, 0) AS total_logins,
    COALESCE(a.distinct_features_used, 0) AS distinct_features_used,
    COALESCE(a.total_active_days, 0) AS total_active_days,
    COALESCE(a.is_engagement_declining, FALSE) AS is_engagement_declining,

    -- 5. Support & Satisfaction
    COALESCE(sp.total_tickets_count, 0) AS total_tickets_count,
    COALESCE(sp.high_urgency_tickets_count, 0) AS high_urgency_tickets_count,
    COALESCE(sp.avg_resolution_hours, 0.0) AS avg_resolution_hours,
    COALESCE(sp.avg_satisfaction_score, 0.0) AS avg_satisfaction_score,
    COALESCE(sp.has_support_friction, FALSE) AS has_support_friction,

    -- 6. Churn Information
    s.is_churned,
    s.churn_date,
    s.churn_reason,
    s.churn_type,
    s.churn_feedback,

    -- 7. High-Value and At-Risk Flags
    CASE 
        WHEN COALESCE(r.current_mrr, 0) >= 179 OR COALESCE(r.lifetime_billed_revenue, 0) >= 1500 
        THEN TRUE 
        ELSE FALSE 
    END AS is_high_value_customer,

    CASE 
        WHEN c.customer_status = 'active' AND (
            COALESCE(sp.has_support_friction, FALSE) = TRUE OR
            COALESCE(a.is_engagement_declining, FALSE) = TRUE OR
            COALESCE(r.has_payment_delinquency, FALSE) = TRUE
        )
        THEN TRUE 
        ELSE FALSE 
    END AS is_at_risk,

    -- Revenue at Risk (Authoritative ARR exposure)
    CASE 
        WHEN c.customer_status = 'active' AND (
            COALESCE(sp.has_support_friction, FALSE) = TRUE OR
            COALESCE(a.is_engagement_declining, FALSE) = TRUE OR
            COALESCE(r.has_payment_delinquency, FALSE) = TRUE
        )
        THEN COALESCE(r.current_arr, 0.0)
        ELSE 0.0 
    END AS revenue_at_risk,

    CURRENT_TIMESTAMP AS dbt_updated_at
FROM customers c
LEFT JOIN subscription_history s ON c.customer_id = s.customer_id
LEFT JOIN revenue r ON c.customer_id = r.customer_id
LEFT JOIN activity a ON c.customer_id = a.customer_id
LEFT JOIN support sp ON c.customer_id = sp.customer_id
