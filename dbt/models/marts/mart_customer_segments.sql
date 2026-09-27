WITH customer_360 AS (
    SELECT * FROM {{ ref('mart_customer_360') }}
),

rfm_metrics AS (
    SELECT
        customer_id,
        full_name,
        email,
        country,
        plan_name,
        customer_status,
        -- Recency: Days since last active date or transaction date
        DATE_DIFF('day', signup_date, CAST('2026-09-01' AS DATE)) AS recency_days,
        -- Frequency: Active platform days + total sessions
        total_sessions AS frequency_sessions,
        -- Monetary: Lifetime billed revenue
        lifetime_billed_revenue AS monetary_spend,
        current_mrr,
        current_arr
    FROM customer_360
),

rfm_scores AS (
    SELECT
        customer_id,
        full_name,
        email,
        country,
        plan_name,
        customer_status,
        recency_days,
        frequency_sessions,
        monetary_spend,
        current_mrr,
        current_arr,
        -- Window function: NTILE scoring from 1 to 5
        NTILE(5) OVER (ORDER BY recency_days ASC) AS r_score,
        NTILE(5) OVER (ORDER BY frequency_sessions ASC) AS f_score,
        NTILE(5) OVER (ORDER BY monetary_spend ASC) AS m_score
    FROM rfm_metrics
)

SELECT
    customer_id,
    full_name,
    email,
    country,
    plan_name,
    customer_status,
    recency_days,
    frequency_sessions,
    monetary_spend,
    current_mrr,
    current_arr,
    r_score,
    f_score,
    m_score,
    (r_score * 100 + f_score * 10 + m_score) AS rfm_combined_score,
    -- Canonical RFM Segmentation Archetypes
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN f_score >= 4 AND m_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score BETWEEN 2 AND 4 THEN 'Potential Loyalists'
        WHEN r_score >= 3 AND f_score <= 2 THEN 'Promising / New Customers'
        WHEN r_score <= 2 AND f_score >= 3 AND m_score >= 3 THEN 'At Risk Accounts'
        WHEN r_score = 1 AND f_score >= 4 AND m_score >= 4 THEN 'Cant Lose Them'
        WHEN r_score <= 2 AND f_score <= 2 AND m_score >= 3 THEN 'About To Sleep'
        WHEN r_score <= 2 AND f_score <= 2 AND m_score <= 2 THEN 'Hibernating / Lost'
        ELSE 'General Subscribers'
    END AS rfm_segment,
    -- Retention Action Playbook
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Offer early access to beta features; invite to executive advisory board'
        WHEN r_score <= 2 AND f_score >= 3 AND m_score >= 3 THEN 'Immediate customer success outreach; schedule quarterly business review'
        WHEN r_score = 1 AND f_score >= 4 AND m_score >= 4 THEN 'Executive intervention; address billing or technical roadblocks immediately'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Automated re-engagement drip campaign; survey feature usability'
        ELSE 'Standard ongoing account nurturing'
    END AS retention_playbook
FROM rfm_scores
