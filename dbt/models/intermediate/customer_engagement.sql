WITH engagement AS (
    SELECT * FROM {{ ref('stg_engagement') }}
)

SELECT
    customer_id,
    COUNT(DISTINCT engagement_date) AS active_weeks_count,
    ROUND(AVG(sessions), 2) AS avg_weekly_sessions,
    MAX(sessions) AS peak_weekly_sessions,
    ROUND(AVG(session_duration_minutes), 2) AS avg_weekly_duration_minutes,
    ROUND(AVG(active_days), 2) AS avg_active_days_per_week,
    ROUND(AVG(features_used), 2) AS avg_features_used_per_week,
    SUM(logins) AS total_logins_count,
    MAX(engagement_date) AS latest_engagement_date
FROM engagement
GROUP BY customer_id
