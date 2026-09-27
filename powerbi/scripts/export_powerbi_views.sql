-- ============================================================================
-- Customer360 Power BI Star Schema SQL Views
-- ============================================================================
-- These views expose the curated analytical marts and facts directly
-- to Power BI for DirectQuery or scheduled incremental refresh.

CREATE SCHEMA IF NOT EXISTS pbi;

-- 1. DimPlan
CREATE OR REPLACE VIEW pbi.dim_plan AS
SELECT 
    plan_id,
    plan_name,
    tier AS plan_tier,
    monthly_price,
    annual_price,
    max_seats
FROM customer360.plans;

-- 2. DimContract
CREATE OR REPLACE VIEW pbi.dim_contract AS
SELECT 
    contract_id,
    contract_type,
    billing_frequency,
    commitment_months,
    flexibility_tier
FROM (
    VALUES 
        (1, 'monthly', 'Monthly', 1, 'Flexible'),
        (2, 'annual', 'Annual', 12, 'Committed'),
        (3, 'multi_year', 'Upfront Multi-Year', 24, 'Long-Term')
) AS t(contract_id, contract_type, billing_frequency, commitment_months, flexibility_tier);

-- 3. DimRegion
CREATE OR REPLACE VIEW pbi.dim_region AS
SELECT 
    DENSE_RANK() OVER (ORDER BY country, COALESCE(region, 'Other'), COALESCE(city, 'Unknown')) AS region_id,
    country,
    COALESCE(region, 'Other') AS region,
    COALESCE(city, 'Unknown') AS city,
    CASE 
        WHEN country IN ('United States', 'Canada') THEN 'North America'
        WHEN country IN ('United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain') THEN 'Europe'
        WHEN country IN ('Australia', 'Japan', 'Singapore', 'India') THEN 'Asia-Pacific'
        ELSE 'Latin America & Global'
    END AS global_theater
FROM customer360.customers
GROUP BY country, region, city;

-- 4. DimAcquisitionChannel
CREATE OR REPLACE VIEW pbi.dim_acquisition_channel AS
SELECT 
    DENSE_RANK() OVER (ORDER BY acquisition_channel) AS channel_id,
    acquisition_channel AS channel_name,
    CASE 
        WHEN LOWER(acquisition_channel) LIKE '%referral%' THEN 'Word of Mouth'
        WHEN LOWER(acquisition_channel) LIKE '%organic%' OR LOWER(acquisition_channel) LIKE '%direct%' THEN 'Inbound'
        WHEN LOWER(acquisition_channel) LIKE '%ad%' OR LOWER(acquisition_channel) LIKE '%paid%' THEN 'Paid Acquisition'
        ELSE 'Digital Channels'
    END AS channel_category
FROM customer360.customers
GROUP BY acquisition_channel;

-- 5. DimCustomer
CREATE OR REPLACE VIEW pbi.dim_customer AS
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    c.full_name,
    c.email,
    c.age,
    CASE 
        WHEN c.age < 26 THEN '18-25'
        WHEN c.age < 36 THEN '26-35'
        WHEN c.age < 51 THEN '36-50'
        ELSE '51+' 
    END AS age_bracket,
    c.gender,
    c.country,
    COALESCE(c.region, 'Other') AS region,
    COALESCE(c.city, 'Unknown') AS city,
    c.signup_date,
    TO_CHAR(c.signup_date, 'YYYYMMDD')::INT AS signup_date_key,
    c.customer_status,
    c.is_churned,
    c.plan_id,
    c.contract_type,
    c.current_mrr,
    c.current_arr,
    c.tenure_months,
    CASE 
        WHEN c.tenure_months <= 3 THEN '01-03 months'
        WHEN c.tenure_months <= 6 THEN '04-06 months'
        WHEN c.tenure_months <= 12 THEN '07-12 months'
        WHEN c.tenure_months <= 24 THEN '13-24 months'
        ELSE '25+ months'
    END AS tenure_bracket,
    c.lifetime_billed_revenue,
    c.is_at_risk,
    c.revenue_at_risk,
    COALESCE(s.rfm_segment, 'Unclassified') AS rfm_segment,
    s.retention_playbook,
    s.recency_days,
    s.frequency_sessions,
    s.monetary_spend,
    s.r_score,
    s.f_score,
    s.m_score,
    s.rfm_combined_score AS rfm_score
FROM customer360.mart_customer_360 c
LEFT JOIN customer360.mart_customer_segments s ON c.customer_id = s.customer_id;

-- 6. FactTransactions
CREATE OR REPLACE VIEW pbi.fact_transactions AS
SELECT 
    t.transaction_id,
    t.customer_id,
    TO_CHAR(t.transaction_date, 'YYYYMMDD')::INT AS date_key,
    s.plan_id,
    CASE 
        WHEN s.contract_type = 'monthly' THEN 1
        WHEN s.contract_type = 'annual' THEN 2
        ELSE 3 
    END AS contract_id,
    t.transaction_date,
    t.amount,
    'USD' AS currency,
    t.payment_status,
    t.transaction_type,
    CASE WHEN t.payment_status = 'completed' THEN 1 ELSE 0 END AS is_successful,
    CASE WHEN t.payment_status = 'failed' THEN 1 ELSE 0 END AS is_failed
FROM customer360.transactions t
JOIN customer360.subscriptions s ON t.subscription_id = s.subscription_id;

-- 7. FactSupport
CREATE OR REPLACE VIEW pbi.fact_support AS
SELECT 
    st.ticket_id,
    st.customer_id,
    TO_CHAR(st.created_at, 'YYYYMMDD')::INT AS date_key,
    s.plan_id,
    CASE 
        WHEN s.contract_type = 'monthly' THEN 1
        WHEN s.contract_type = 'annual' THEN 2
        ELSE 3 
    END AS contract_id,
    st.created_at::DATE AS created_date,
    st.category,
    st.priority,
    st.status,
    ROUND(st.resolution_time::NUMERIC, 1) AS resolution_time_hours,
    COALESCE(st.satisfaction_score, 3) AS satisfaction_score,
    CASE WHEN st.priority = 'urgent' THEN 1 ELSE 0 END AS is_escalated,
    CASE WHEN st.satisfaction_score <= 2 OR st.resolution_time > 24 THEN 1 ELSE 0 END AS has_friction
FROM customer360.support_tickets st
JOIN customer360.subscriptions s ON st.customer_id = s.customer_id;

-- 8. FactChurn
CREATE OR REPLACE VIEW pbi.fact_churn AS
SELECT 
    ce.churn_id,
    ce.customer_id,
    TO_CHAR(ce.churn_date, 'YYYYMMDD')::INT AS date_key,
    s.plan_id,
    CASE 
        WHEN s.contract_type = 'monthly' THEN 1
        WHEN s.contract_type = 'annual' THEN 2
        ELSE 3 
    END AS contract_id,
    ce.churn_date,
    ce.churn_reason,
    ce.churn_type,
    ce.feedback,
    ROUND(p.monthly_price::NUMERIC, 2) AS mrr_lost,
    ROUND((p.monthly_price * 12)::NUMERIC, 2) AS arr_lost,
    ROUND((DATE_PART('year', ce.churn_date) - DATE_PART('year', s.start_date)) * 12 + 
          (DATE_PART('month', ce.churn_date) - DATE_PART('month', s.start_date))::NUMERIC, 1) AS tenure_at_churn_months
FROM customer360.churn_events ce
JOIN customer360.subscriptions s ON ce.subscription_id = s.subscription_id
JOIN customer360.plans p ON s.plan_id = p.plan_id;
