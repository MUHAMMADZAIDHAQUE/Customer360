WITH engagement AS (
    SELECT * FROM {{ ref('stg_engagement') }}
),

product_usage AS (
    SELECT * FROM {{ ref('stg_product_usage') }}
),

usage_agg AS (
    SELECT
        customer_id,
        COUNT(DISTINCT feature_name) AS distinct_features_used,
        SUM(usage_count) AS total_feature_events,
        SUM(duration_seconds) AS total_feature_duration_seconds
    FROM product_usage
    GROUP BY customer_id
),

engagement_agg AS (
    SELECT
        customer_id,
        MIN(engagement_date) AS first_active_date,
        MAX(engagement_date) AS last_active_date,
        SUM(sessions) AS total_sessions,
        SUM(session_duration_minutes) AS total_session_minutes,
        ROUND(AVG(session_duration_minutes), 2) AS avg_session_minutes,
        SUM(logins) AS total_logins,
        AVG(features_used) AS avg_features_used_per_week,
        SUM(active_days) AS total_active_days,
        -- Trailing 30 days vs prior period for churn momentum analysis
        SUM(CASE WHEN engagement_date >= '2026-08-01' THEN sessions ELSE 0 END) AS recent_sessions_trailing_30d,
        SUM(CASE WHEN engagement_date BETWEEN '2026-07-01' AND '2026-07-31' THEN sessions ELSE 0 END) AS prior_sessions_trailing_30d
    FROM engagement
    GROUP BY customer_id
)

SELECT
    e.customer_id,
    e.first_active_date,
    e.last_active_date,
    e.total_sessions,
    e.total_session_minutes,
    e.avg_session_minutes,
    e.total_logins,
    e.avg_features_used_per_week,
    e.total_active_days,
    COALESCE(u.distinct_features_used, 0) AS distinct_features_used,
    COALESCE(u.total_feature_events, 0) AS total_feature_events,
    COALESCE(u.total_feature_duration_seconds, 0) AS total_feature_duration_seconds,
    e.recent_sessions_trailing_30d,
    e.prior_sessions_trailing_30d,
    CASE 
        WHEN e.prior_sessions_trailing_30d > 0 
             AND (e.recent_sessions_trailing_30d * 1.0 / e.prior_sessions_trailing_30d) < 0.5 
        THEN TRUE 
        ELSE FALSE 
    END AS is_engagement_declining
FROM engagement_agg e
LEFT JOIN usage_agg u ON e.customer_id = u.customer_id
