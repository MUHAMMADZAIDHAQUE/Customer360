"""Customer360 Reusable SQL Analytics Engine.

Provides authoritative analytical queries for executive KPIs, multidimensional
churn drivers, and revenue exposure using CTEs, window functions, ranking,
CASE statements, and date functions over dbt marts and Parquet storage.
"""

import os
import sys
from typing import Dict, Any, List
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from analytics.duckdb_client import DuckDBClient


class Customer360Analytics:
    """Executes canonical SQL analytics queries against the dbt analytics layer."""

    def __init__(self, db_client: DuckDBClient = None):
        self.client = db_client or DuckDBClient()
        self.client.register_parquet_views()

    def get_executive_kpis(self) -> Dict[str, Any]:
        """Calculates platform-wide executive metrics using canonical formulas."""
        sql = """
            WITH metrics AS (
                SELECT
                    COUNT(DISTINCT customer_id) AS total_customers,
                    COUNT(DISTINCT CASE WHEN customer_status = 'active' THEN customer_id END) AS active_customers,
                    COUNT(DISTINCT CASE WHEN is_churned THEN customer_id END) AS churned_customers,
                    SUM(current_mrr) AS total_mrr,
                    SUM(current_arr) AS total_arr,
                    SUM(lifetime_billed_revenue) AS total_lifetime_revenue,
                    SUM(revenue_at_risk) AS total_revenue_at_risk,
                    COUNT(DISTINCT CASE WHEN is_at_risk THEN customer_id END) AS at_risk_accounts_count
                FROM mart_customer_360
            )
            SELECT
                total_customers,
                active_customers,
                churned_customers,
                ROUND(churned_customers * 100.0 / NULLIF(total_customers, 0), 2) AS overall_churn_rate_pct,
                ROUND(100.0 - (churned_customers * 100.0 / NULLIF(total_customers, 0)), 2) AS overall_retention_rate_pct,
                ROUND(total_mrr, 2) AS active_mrr,
                ROUND(total_arr, 2) AS active_arr,
                ROUND(total_mrr * 1.0 / NULLIF(active_customers, 0), 2) AS arpu,
                ROUND(total_lifetime_revenue, 2) AS total_realized_revenue,
                ROUND(total_revenue_at_risk, 2) AS total_revenue_at_risk,
                at_risk_accounts_count
            FROM metrics;
        """
        df = self.client.query(sql)
        return df.to_dict(orient="records")[0]

    def get_monthly_churn_trend(self) -> pd.DataFrame:
        """Returns monthly churn, retention, and MRR growth using window functions."""
        sql = """
            SELECT
                observation_month,
                active_customers_count,
                new_signups_count,
                churned_customers_count,
                net_customer_growth,
                monthly_churn_rate_pct,
                monthly_retention_rate_pct,
                active_mrr,
                active_arr,
                arpu,
                revenue_at_risk,
                cash_collected
            FROM mart_monthly_kpis
            ORDER BY observation_month ASC;
        """
        return self.client.query(sql)

    def get_churn_by_contract(self) -> pd.DataFrame:
        """Analyzes churn rates and retention across contract types."""
        sql = """
            SELECT
                contract_type,
                COUNT(customer_id) AS total_customers,
                COUNT(CASE WHEN is_churned THEN 1 END) AS churned_count,
                COUNT(CASE WHEN NOT is_churned THEN 1 END) AS retained_count,
                ROUND(COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0), 2) AS churn_rate_pct,
                ROUND(100.0 - (COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0)), 2) AS retention_rate_pct,
                ROUND(SUM(current_arr), 2) AS total_arr
            FROM mart_customer_churn
            GROUP BY contract_type
            ORDER BY churn_rate_pct DESC;
        """
        return self.client.query(sql)

    def get_churn_by_plan(self) -> pd.DataFrame:
        """Analyzes churn and ARR exposure across plan tiers."""
        sql = """
            SELECT
                plan_tier,
                COUNT(customer_id) AS total_subscribers,
                COUNT(CASE WHEN is_churned THEN 1 END) AS churned_subscribers,
                ROUND(COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0), 2) AS churn_rate_pct,
                ROUND(AVG(current_mrr), 2) AS avg_plan_mrr,
                ROUND(SUM(current_arr), 2) AS active_arr
            FROM mart_customer_churn
            GROUP BY plan_tier
            ORDER BY churn_rate_pct DESC;
        """
        return self.client.query(sql)

    def get_churn_by_tenure(self) -> pd.DataFrame:
        """Examines churn concentration across customer tenure buckets."""
        sql = """
            SELECT
                tenure_cohort_bucket,
                COUNT(customer_id) AS total_customers,
                COUNT(CASE WHEN is_churned THEN 1 END) AS churned_customers,
                ROUND(COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0), 2) AS churn_rate_pct,
                ROUND(AVG(tenure_months), 1) AS avg_tenure_months
            FROM mart_customer_churn
            GROUP BY tenure_cohort_bucket
            ORDER BY avg_tenure_months ASC;
        """
        return self.client.query(sql)

    def get_churn_by_acquisition_channel(self) -> pd.DataFrame:
        """Evaluates customer acquisition efficiency and downstream retention."""
        sql = """
            SELECT
                acquisition_channel,
                COUNT(customer_id) AS total_acquired,
                COUNT(CASE WHEN is_churned THEN 1 END) AS total_churned,
                ROUND(COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0), 2) AS churn_rate_pct,
                ROUND(AVG(tenure_months), 1) AS avg_tenure_months,
                ROUND(SUM(current_arr), 2) AS retained_arr
            FROM mart_customer_churn
            GROUP BY acquisition_channel
            ORDER BY churn_rate_pct DESC;
        """
        return self.client.query(sql)

    def get_churn_by_support_and_engagement(self) -> pd.DataFrame:
        """Correlates support satisfaction ratings and session frequency with churn."""
        sql = """
            SELECT
                support_csat_bucket,
                engagement_level_bucket,
                COUNT(customer_id) AS customer_count,
                COUNT(CASE WHEN is_churned THEN 1 END) AS churned_count,
                ROUND(COUNT(CASE WHEN is_churned THEN 1 END) * 100.0 / NULLIF(COUNT(customer_id), 0), 2) AS churn_rate_pct
            FROM mart_customer_churn
            GROUP BY support_csat_bucket, engagement_level_bucket
            ORDER BY churn_rate_pct DESC;
        """
        return self.client.query(sql)

    def get_top_customers_by_clv(self, limit: int = 15) -> pd.DataFrame:
        """Ranks highest lifetime value accounts using window dense ranking."""
        sql = f"""
            SELECT
                customer_id,
                plan_name,
                plan_tier,
                contract_type,
                subscription_status,
                total_invoices_billed,
                total_realized_revenue AS realized_clv,
                revenue_rank,
                customer_revenue_tier
            FROM mart_customer_revenue
            ORDER BY revenue_rank ASC
            LIMIT {limit};
        """
        return self.client.query(sql)

    def get_high_value_customers_at_risk(self, limit: int = 15) -> pd.DataFrame:
        """Identifies top accounts with active subscriptions at immediate risk of attrition."""
        sql = f"""
            SELECT
                customer_id,
                full_name,
                country,
                plan_name,
                contract_type,
                current_mrr,
                revenue_at_risk AS annual_arr_at_risk,
                avg_satisfaction_score,
                total_tickets_count,
                is_engagement_declining,
                has_payment_delinquency
            FROM mart_customer_360
            WHERE customer_status = 'active' AND is_at_risk = TRUE
            ORDER BY revenue_at_risk DESC
            LIMIT {limit};
        """
        return self.client.query(sql)


if __name__ == "__main__":
    analytics = Customer360Analytics()
    print("==================================================")
    print("CUSTOMER360 - CANONICAL EXECUTIVE KPIS")
    print("==================================================")
    kpis = analytics.get_executive_kpis()
    for k, v in kpis.items():
        print(f"  {k}: {v}")

    print("\n==================================================")
    print("CHURN BY CONTRACT TYPE")
    print("==================================================")
    print(analytics.get_churn_by_contract().to_string(index=False))

    print("\n==================================================")
    print("CHURN BY PLAN TIER")
    print("==================================================")
    print(analytics.get_churn_by_plan().to_string(index=False))

    print("\n==================================================")
    print("TOP 10 HIGH VALUE ACCOUNTS AT RISK (ANNUAL ARR EXPOSURE)")
    print("==================================================")
    print(analytics.get_high_value_customers_at_risk(10).to_string(index=False))
