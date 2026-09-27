"""
Customer360 - Star Schema Builder for Power BI
==============================================
Constructs an enterprise star schema from the curated analytical marts:
- Dimensions:
    1. DimCustomer (Unified 360 attributes, RFM segments, ML churn predictions)
    2. DimDate (Standard continuous date dimension with ISO hierarchy)
    3. DimPlan (Tier, pricing, seat allocations)
    4. DimContract (Contract type, billing frequency, commitment length)
    5. DimRegion (Country, region, city, global theater)
    6. DimAcquisitionChannel (Channel name, category)
- Facts:
    1. FactTransactions (Financial billing ledger)
    2. FactEngagement (Monthly active telemetry and feature adoption)
    3. FactSupport (Customer service ticket resolution and CSAT)
    4. FactChurn (Historical attrition events with lost recurring revenue)

Exports to powerbi/data/*.csv and powerbi/data/*.parquet.
"""

import os
import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DUCKDB_PATH = os.path.join(BASE_DIR, "data", "processed", "customer360.duckdb")
PRED_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "customer_churn_predictions.parquet")
OUT_DIR = os.path.join(BASE_DIR, "powerbi", "data")
os.makedirs(OUT_DIR, exist_ok=True)


def build_star_schema():
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    print("Building Customer360 Star Schema from curated marts...")

    # =========================================================================
    # 1. DimPlan
    # =========================================================================
    print("-> Creating DimPlan...")
    dim_plan = con.execute("""
        SELECT 
            plan_id,
            plan_name,
            tier as plan_tier,
            ROUND(CAST(monthly_price AS DOUBLE), 2) as monthly_price,
            ROUND(CAST(annual_price AS DOUBLE), 2) as annual_price,
            max_seats
        FROM plans
        ORDER BY monthly_price;
    """).df()

    # =========================================================================
    # 2. DimContract
    # =========================================================================
    print("-> Creating DimContract...")
    dim_contract = pd.DataFrame([
        {
            "contract_id": 1,
            "contract_type": "monthly",
            "billing_frequency": "Monthly",
            "commitment_months": 1,
            "flexibility_tier": "Flexible"
        },
        {
            "contract_id": 2,
            "contract_type": "annual",
            "billing_frequency": "Annual",
            "commitment_months": 12,
            "flexibility_tier": "Committed"
        },
        {
            "contract_id": 3,
            "contract_type": "multi_year",
            "billing_frequency": "Upfront Multi-Year",
            "commitment_months": 24,
            "flexibility_tier": "Long-Term"
        }
    ])

    # =========================================================================
    # 3. DimRegion
    # =========================================================================
    print("-> Creating DimRegion...")
    dim_region = con.execute("""
        SELECT DISTINCT
            country,
            COALESCE(region, 'Other') as region,
            COALESCE(city, 'Unknown') as city
        FROM customers
        ORDER BY country, region, city;
    """).df()
    dim_region.reset_index(inplace=True)
    dim_region.rename(columns={"index": "region_id"}, inplace=True)
    dim_region["region_id"] += 1

    def map_theater(country):
        if country in ["United States", "Canada"]:
            return "North America"
        elif country in ["United Kingdom", "Germany", "France", "Netherlands", "Spain"]:
            return "Europe"
        elif country in ["Australia", "Japan", "Singapore", "India"]:
            return "Asia-Pacific"
        else:
            return "Latin America & Global"

    dim_region["global_theater"] = dim_region["country"].apply(map_theater)

    # =========================================================================
    # 4. DimAcquisitionChannel
    # =========================================================================
    print("-> Creating DimAcquisitionChannel...")
    channels = con.execute("SELECT DISTINCT acquisition_channel FROM customers ORDER BY acquisition_channel;").df()
    channels.rename(columns={"acquisition_channel": "channel_name"}, inplace=True)
    channels.reset_index(inplace=True)
    channels.rename(columns={"index": "channel_id"}, inplace=True)
    channels["channel_id"] += 1

    def map_channel_cat(name):
        if "referral" in name.lower():
            return "Word of Mouth"
        elif "organic" in name.lower() or "direct" in name.lower():
            return "Inbound"
        elif "ad" in name.lower() or "paid" in name.lower():
            return "Paid Acquisition"
        elif "partner" in name.lower() or "event" in name.lower():
            return "Field & Partners"
        return "Digital Channels"

    channels["channel_category"] = channels["channel_name"].apply(map_channel_cat)
    dim_channel = channels

    # =========================================================================
    # 5. DimCustomer (Enriched with RFM segments and ML Predictions)
    # =========================================================================
    print("-> Creating DimCustomer from mart_customer_360, mart_customer_segments, and ML predictions...")
    cust_base = con.execute("""
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
            END as age_bracket,
            c.gender,
            c.country,
            COALESCE(c.region, 'Other') as region,
            COALESCE(c.city, 'Unknown') as city,
            c.signup_date,
            strftime(c.signup_date, '%Y%m%d')::INT as signup_date_key,
            c.acquisition_channel,
            c.customer_status,
            c.is_churned,
            c.plan_id,
            c.contract_type,
            ROUND(CAST(c.current_mrr AS DOUBLE), 2) as current_mrr,
            ROUND(CAST(c.current_arr AS DOUBLE), 2) as current_arr,
            ROUND(c.tenure_months, 1) as tenure_months,
            CASE 
                WHEN c.tenure_months <= 3 THEN '01-03 months'
                WHEN c.tenure_months <= 6 THEN '04-06 months'
                WHEN c.tenure_months <= 12 THEN '07-12 months'
                WHEN c.tenure_months <= 24 THEN '13-24 months'
                ELSE '25+ months'
            END as tenure_bracket,
            ROUND(CAST(c.lifetime_billed_revenue AS DOUBLE), 2) as lifetime_billed_revenue,
            c.is_at_risk,
            ROUND(CAST(c.revenue_at_risk AS DOUBLE), 2) as revenue_at_risk,
            c.is_engagement_declining,
            c.has_support_friction,
            c.has_payment_delinquency
        FROM main_marts.mart_customer_360 c;
    """).df()

    # Join RFM Segments
    rfm_df = con.execute("""
        SELECT 
            customer_id,
            rfm_segment,
            retention_playbook,
            recency_days,
            frequency_sessions,
            ROUND(CAST(monetary_spend AS DOUBLE), 2) as monetary_spend,
            r_score,
            f_score,
            m_score,
            rfm_combined_score as rfm_score
        FROM main_marts.mart_customer_segments;
    """).df()

    # Join ML Predictions
    pred_df = pd.read_parquet(PRED_PATH)[["customer_id", "churn_probability", "risk_tier", "primary_risk_factor"]]

    dim_customer = cust_base.merge(rfm_df, on="customer_id", how="left")
    dim_customer = dim_customer.merge(pred_df, on="customer_id", how="left")

    # Map foreign keys to DimRegion, DimContract, DimAcquisitionChannel
    dim_customer = dim_customer.merge(dim_region, on=["country", "region", "city"], how="left")
    dim_customer = dim_customer.merge(dim_contract[["contract_id", "contract_type"]], on="contract_type", how="left")
    dim_customer = dim_customer.merge(dim_channel[["channel_id", "channel_name"]], left_on="acquisition_channel", right_on="channel_name", how="left")

    default_probs = pd.Series(np.where(dim_customer["is_churned"], 1.0, 0.05), index=dim_customer.index)
    default_tiers = pd.Series(np.where(dim_customer["is_churned"], "Critical", "Low"), index=dim_customer.index)
    dim_customer["churn_probability"] = dim_customer["churn_probability"].fillna(default_probs).round(4)
    dim_customer["risk_tier"] = dim_customer["risk_tier"].fillna(default_tiers)
    dim_customer["primary_risk_factor"] = dim_customer["primary_risk_factor"].fillna("contract_type_monthly")

    # =========================================================================
    # 6. DimDate
    # =========================================================================
    print("-> Creating DimDate continuous calendar...")
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2026, 12, 31)
    curr = start_date
    date_records = []

    while curr <= end_date:
        date_records.append({
            "date": curr.strftime("%Y-%m-%d"),
            "date_key": int(curr.strftime("%Y%m%d")),
            "year": curr.year,
            "quarter": f"Q{(curr.month - 1) // 3 + 1}",
            "year_quarter": f"{curr.year}-Q{(curr.month - 1) // 3 + 1}",
            "month": curr.month,
            "month_name": curr.strftime("%B"),
            "year_month": curr.strftime("%Y-%m"),
            "week_of_year": curr.isocalendar()[1],
            "day_of_month": curr.day,
            "day_of_week": curr.weekday() + 1,
            "day_name": curr.strftime("%A"),
            "is_weekend": curr.weekday() in [5, 6]
        })
        curr += timedelta(days=1)

    dim_date = pd.DataFrame(date_records)

    # =========================================================================
    # 7. FactTransactions
    # =========================================================================
    print("-> Creating FactTransactions...")
    fact_transactions = con.execute("""
        SELECT 
            t.transaction_id,
            t.customer_id,
            strftime(t.transaction_date::DATE, '%Y%m%d')::INT as date_key,
            s.plan_id,
            CASE 
                WHEN s.contract_type = 'monthly' THEN 1
                WHEN s.contract_type = 'annual' THEN 2
                ELSE 3 
            END as contract_id,
            t.transaction_date::DATE as transaction_date,
            ROUND(CAST(t.amount AS DOUBLE), 2) as amount,
            'USD' as currency,
            t.payment_method,
            t.payment_status,
            t.transaction_type,
            CAST(t.payment_status = 'completed' AS INT) as is_successful,
            CAST(t.payment_status = 'failed' AS INT) as is_failed
        FROM transactions t
        JOIN subscriptions s ON t.subscription_id = s.subscription_id;
    """).df()

    # =========================================================================
    # 8. FactEngagement (Monthly Customer Usage Rollup)
    # =========================================================================
    print("-> Creating FactEngagement...")
    fact_engagement = con.execute("""
        SELECT 
            ROW_NUMBER() OVER () as engagement_key,
            e.customer_id,
            strftime(date_trunc('month', e.date::DATE), '%Y%m%d')::INT as date_key,
            s.plan_id,
            CASE 
                WHEN s.contract_type = 'monthly' THEN 1
                WHEN s.contract_type = 'annual' THEN 2
                ELSE 3 
            END as contract_id,
            strftime(date_trunc('month', e.date::DATE), '%Y-%m-01')::DATE as observation_month,
            SUM(e.sessions) as sessions_count,
            ROUND(SUM(e.session_duration), 1) as session_minutes,
            SUM(e.logins) as logins_count,
            COUNT(DISTINCT e.date) as active_days
        FROM customer_engagement e
        JOIN subscriptions s ON e.customer_id = s.customer_id
        GROUP BY 
            e.customer_id, 
            date_trunc('month', e.date::DATE), 
            s.plan_id, 
            s.contract_type;
    """).df()

    # =========================================================================
    # 9. FactSupport
    # =========================================================================
    print("-> Creating FactSupport...")
    fact_support = con.execute("""
        SELECT 
            st.ticket_id,
            st.customer_id,
            strftime(st.created_at::TIMESTAMP, '%Y%m%d')::INT as date_key,
            s.plan_id,
            CASE 
                WHEN s.contract_type = 'monthly' THEN 1
                WHEN s.contract_type = 'annual' THEN 2
                ELSE 3 
            END as contract_id,
            st.created_at::DATE as created_date,
            st.category,
            st.priority,
            st.status,
            ROUND(CAST(st.resolution_time AS DOUBLE), 1) as resolution_time_hours,
            COALESCE(st.satisfaction_score, 3) as satisfaction_score,
            CAST(st.priority = 'urgent' AS INT) as is_escalated,
            CAST(st.satisfaction_score <= 2 OR st.resolution_time > 24 AS INT) as has_friction
        FROM support_tickets st
        JOIN subscriptions s ON st.customer_id = s.customer_id;
    """).df()

    # =========================================================================
    # 10. FactChurn
    # =========================================================================
    print("-> Creating FactChurn...")
    fact_churn = con.execute("""
        SELECT 
            ce.churn_id,
            ce.customer_id,
            strftime(ce.churn_date::DATE, '%Y%m%d')::INT as date_key,
            s.plan_id,
            CASE 
                WHEN s.contract_type = 'monthly' THEN 1
                WHEN s.contract_type = 'annual' THEN 2
                ELSE 3 
            END as contract_id,
            ce.churn_date::DATE as churn_date,
            ce.churn_reason,
            ce.churn_type,
            ce.feedback,
            ROUND(CAST(p.monthly_price AS DOUBLE), 2) as mrr_lost,
            ROUND(CAST(p.monthly_price * 12 AS DOUBLE), 2) as arr_lost,
            ROUND(DATEDIFF('month', s.start_date::DATE, ce.churn_date::DATE), 1) as tenure_at_churn_months
        FROM churn_events ce
        JOIN subscriptions s ON ce.subscription_id = s.subscription_id
        JOIN plans p ON s.plan_id = p.plan_id;
    """).df()

    # =========================================================================
    # Save Artifacts to CSV and Parquet
    # =========================================================================
    tables = {
        "DimCustomer": dim_customer,
        "DimDate": dim_date,
        "DimPlan": dim_plan,
        "DimContract": dim_contract,
        "DimRegion": dim_region,
        "DimAcquisitionChannel": dim_channel,
        "FactTransactions": fact_transactions,
        "FactEngagement": fact_engagement,
        "FactSupport": fact_support,
        "FactChurn": fact_churn
    }

    print("\nExporting Star Schema to powerbi/data/ (Parquet & CSV)...")
    for name, df in tables.items():
        parquet_file = os.path.join(OUT_DIR, f"{name}.parquet")
        csv_file = os.path.join(OUT_DIR, f"{name}.csv")
        df.to_parquet(parquet_file, index=False)
        df.to_csv(csv_file, index=False)
        print(f"  ✓ {name:22}: {len(df):>6} rows -> {parquet_file}")

    con.close()
    print("\nCustomer360 Star Schema generated successfully!")


if __name__ == "__main__":
    build_star_schema()
