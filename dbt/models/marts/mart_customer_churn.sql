WITH customer_360 AS (
    SELECT * FROM {{ ref('mart_customer_360') }}
),

enriched_churn AS (
    SELECT
        customer_id,
        country,
        region,
        acquisition_channel,
        plan_name,
        plan_tier,
        contract_type,
        current_mrr,
        current_arr,
        tenure_months,
        CASE
            WHEN tenure_months <= 3 THEN '0 - 3 Months'
            WHEN tenure_months <= 6 THEN '3 - 6 Months'
            WHEN tenure_months <= 12 THEN '6 - 12 Months'
            ELSE '12+ Months'
        END AS tenure_cohort_bucket,
        CASE
            WHEN avg_satisfaction_score IS NULL OR avg_satisfaction_score = 0 THEN 'No Tickets'
            WHEN avg_satisfaction_score <= 2.5 THEN 'Low CSAT (<= 2.5)'
            WHEN avg_satisfaction_score <= 3.8 THEN 'Moderate CSAT (2.5 - 3.8)'
            ELSE 'High CSAT (3.8+)'
        END AS support_csat_bucket,
        CASE
            WHEN total_sessions <= 20 THEN 'Low Engagement (<= 20 sessions)'
            WHEN total_sessions <= 80 THEN 'Medium Engagement (21 - 80 sessions)'
            ELSE 'High Engagement (80+ sessions)'
        END AS engagement_level_bucket,
        customer_status,
        is_churned,
        churn_date,
        churn_reason,
        churn_type
    FROM customer_360
)

SELECT
    customer_id,
    country,
    region,
    acquisition_channel,
    plan_name,
    plan_tier,
    contract_type,
    current_mrr,
    current_arr,
    tenure_months,
    tenure_cohort_bucket,
    support_csat_bucket,
    engagement_level_bucket,
    customer_status,
    is_churned,
    churn_date,
    churn_reason,
    churn_type,
    -- Window calculations: Churn benchmark rates per dimension
    ROUND(
        COUNT(CASE WHEN is_churned THEN 1 END) OVER (PARTITION BY plan_tier) * 100.0 / 
        NULLIF(COUNT(*) OVER (PARTITION BY plan_tier), 0), 2
    ) AS plan_tier_churn_rate_pct,
    ROUND(
        COUNT(CASE WHEN is_churned THEN 1 END) OVER (PARTITION BY contract_type) * 100.0 / 
        NULLIF(COUNT(*) OVER (PARTITION BY contract_type), 0), 2
    ) AS contract_type_churn_rate_pct,
    ROUND(
        COUNT(CASE WHEN is_churned THEN 1 END) OVER (PARTITION BY acquisition_channel) * 100.0 / 
        NULLIF(COUNT(*) OVER (PARTITION BY acquisition_channel), 0), 2
    ) AS channel_churn_rate_pct,
    ROUND(
        COUNT(CASE WHEN is_churned THEN 1 END) OVER (PARTITION BY tenure_cohort_bucket) * 100.0 / 
        NULLIF(COUNT(*) OVER (PARTITION BY tenure_cohort_bucket), 0), 2
    ) AS tenure_bucket_churn_rate_pct
FROM enriched_churn
