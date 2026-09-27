-- Custom singular test: Return rows where monthly_churn_rate_pct is out of bounds
SELECT
    observation_month,
    monthly_churn_rate_pct
FROM {{ ref('mart_monthly_kpis') }}
WHERE monthly_churn_rate_pct < 0.0 OR monthly_churn_rate_pct > 100.0
