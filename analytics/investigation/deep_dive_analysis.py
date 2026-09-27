"""
Customer360 - Comprehensive Data Analyst Investigation
======================================================
Executes deep-dive investigations across all 10 core business areas:
1. Customer Demographics
2. Revenue Dynamics (MRR, ARR, ARPU)
3. Churn Analysis
4. Retention Curves
5. Customer Engagement & Activity
6. Customer Support & Resolution
7. Product Usage Benchmarks
8. Acquisition Channels
9. Contract Types
10. Subscription Plans

Plus detailed bivariate churn analyses:
- churn vs tenure
- churn vs contract
- churn vs price
- churn vs engagement
- churn vs support
- churn vs payment failures
- churn vs plan
- churn vs acquisition channel
- churn vs geography

Strictly adheres to scientific rigor: Correlation is NOT causation.
Uses: SQL, DuckDB, Polars, Pandas, Matplotlib, Plotly.
"""

import os
import duckdb
import numpy as np
import pandas as pd
import polars as pl
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/customer360.duckdb"))
FIG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reports/figures"))


class DeepDiveInvestigator:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(FIG_DIR, exist_ok=True)

    def get_connection(self):
        return duckdb.connect(self.db_path, read_only=True)

    def analyze_demographics(self, con) -> dict:
        """1. Customer demographics: Age, gender, country, region, city."""
        df = con.execute("""
            SELECT 
                gender,
                country,
                region,
                COUNT(*) as count,
                ROUND(AVG(age), 1) as avg_age,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_count,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(SUM(current_mrr), 2) as active_mrr
            FROM main_marts.mart_customer_360
            GROUP BY gender, country, region
            ORDER BY count DESC;
        """).df()

        age_summary = con.execute("""
            SELECT 
                MIN(age) as min_age,
                MAX(age) as max_age,
                ROUND(AVG(age), 1) as mean_age,
                ROUND(MEDIAN(age), 1) as median_age,
                ROUND(STDDEV(age), 1) as std_age
            FROM main_marts.mart_customer_360;
        """).df().to_dict(orient="records")[0]

        country_summary = con.execute("""
            SELECT 
                country,
                COUNT(*) as customer_count,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(SUM(current_arr), 2) as total_arr
            FROM main_marts.mart_customer_360
            GROUP BY country
            ORDER BY customer_count DESC;
        """).df().to_dict(orient="records")

        return {
            "age_metrics": age_summary,
            "country_metrics": country_summary,
            "raw_demographics": df.to_dict(orient="records")
        }

    def analyze_revenue(self, con) -> dict:
        """2. Revenue: MRR, ARR, ARPU, realized CLV, tier contribution."""
        kpis = con.execute("""
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active_customers,
                ROUND(SUM(current_mrr), 2) as total_mrr,
                ROUND(SUM(current_arr), 2) as total_arr,
                ROUND(SUM(current_mrr) / NULLIF(SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END), 0), 2) as arpu,
                ROUND(SUM(lifetime_billed_revenue), 2) as total_realized_revenue,
                ROUND(AVG(lifetime_billed_revenue), 2) as avg_realized_clv,
                ROUND(MEDIAN(lifetime_billed_revenue), 2) as median_realized_clv
            FROM main_marts.mart_customer_360;
        """).df().to_dict(orient="records")[0]

        plan_rev = con.execute("""
            SELECT 
                plan_name,
                plan_tier,
                COUNT(*) as total_subscribers,
                SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active_subscribers,
                ROUND(SUM(current_mrr), 2) as plan_mrr,
                ROUND(SUM(current_arr), 2) as plan_arr,
                ROUND(SUM(current_arr) * 100.0 / (SELECT SUM(current_arr) FROM main_marts.mart_customer_360), 2) as arr_share_pct
            FROM main_marts.mart_customer_360
            GROUP BY plan_name, plan_tier
            ORDER BY plan_arr DESC;
        """).df().to_dict(orient="records")

        return {"executive_kpis": kpis, "plan_revenue_breakdown": plan_rev}

    def analyze_churn_and_retention(self, con) -> dict:
        """3 & 4. Churn and Retention dynamics."""
        churn_overall = con.execute("""
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_customers,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(100.0 - (SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as retention_rate_pct
            FROM main_marts.mart_customer_360;
        """).df().to_dict(orient="records")[0]

        churn_reasons = con.execute("""
            SELECT 
                churn_reason,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM main_marts.mart_customer_360 WHERE is_churned), 2) as pct_of_churns
            FROM main_marts.mart_customer_360
            WHERE is_churned AND churn_reason IS NOT NULL
            GROUP BY churn_reason
            ORDER BY count DESC;
        """).df().to_dict(orient="records")

        tenure_churn = con.execute("""
            SELECT 
                CASE 
                    WHEN tenure_months <= 3 THEN '01-03 months'
                    WHEN tenure_months <= 6 THEN '04-06 months'
                    WHEN tenure_months <= 12 THEN '07-12 months'
                    WHEN tenure_months <= 24 THEN '13-24 months'
                    ELSE '25+ months'
                END as tenure_bracket,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_count,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(AVG(current_mrr), 2) as avg_mrr
            FROM main_marts.mart_customer_360
            GROUP BY tenure_bracket
            ORDER BY tenure_bracket;
        """).df().to_dict(orient="records")

        return {
            "overall": churn_overall,
            "reasons": churn_reasons,
            "tenure_dynamics": tenure_churn
        }

    def analyze_engagement_and_support(self, con) -> dict:
        """5 & 6. Engagement decay and Support friction metrics."""
        engagement_stats = con.execute("""
            SELECT 
                customer_status,
                COUNT(*) as customer_count,
                ROUND(AVG(total_sessions), 1) as avg_sessions,
                ROUND(MEDIAN(total_sessions), 1) as median_sessions,
                ROUND(AVG(total_session_minutes), 1) as avg_engagement_minutes,
                ROUND(AVG(total_active_days), 1) as avg_active_days,
                SUM(CASE WHEN is_engagement_declining THEN 1 ELSE 0 END) as declining_engagement_count,
                ROUND(SUM(CASE WHEN is_engagement_declining THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as declining_pct
            FROM main_marts.mart_customer_360
            GROUP BY customer_status;
        """).df().to_dict(orient="records")

        support_stats = con.execute("""
            SELECT 
                customer_status,
                COUNT(*) as customer_count,
                ROUND(AVG(total_tickets_count), 2) as avg_tickets,
                ROUND(AVG(high_urgency_tickets_count), 2) as avg_urgent_tickets,
                ROUND(AVG(CASE WHEN avg_satisfaction_score > 0 THEN avg_satisfaction_score ELSE NULL END), 2) as avg_csat,
                SUM(CASE WHEN has_support_friction THEN 1 ELSE 0 END) as friction_count,
                ROUND(SUM(CASE WHEN has_support_friction THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as friction_pct
            FROM main_marts.mart_customer_360
            GROUP BY customer_status;
        """).df().to_dict(orient="records")

        return {
            "engagement": engagement_stats,
            "support": support_stats
        }

    def analyze_product_usage(self, con) -> dict:
        """7. Product usage benchmarks across features and plan tiers."""
        product_usage = con.execute("""
            SELECT 
                c.plan_tier,
                c.customer_status,
                u.feature_name,
                COUNT(DISTINCT c.customer_id) as customer_count,
                ROUND(AVG(u.usage_count), 1) as avg_usage_count,
                ROUND(AVG(u.duration_seconds) / 60.0, 1) as avg_duration_minutes,
                ROUND(SUM(u.usage_count), 0) as total_feature_events
            FROM main_marts.mart_customer_360 c
            JOIN main_staging.stg_product_usage u ON c.customer_id = u.customer_id
            GROUP BY c.plan_tier, c.customer_status, u.feature_name
            ORDER BY c.plan_tier, u.feature_name, c.customer_status;
        """).df().to_dict(orient="records")

        feature_summary = con.execute("""
            SELECT 
                u.feature_name,
                COUNT(DISTINCT u.customer_id) as users_count,
                ROUND(SUM(u.usage_count), 0) as total_events,
                ROUND(AVG(u.usage_count), 2) as avg_events_per_session,
                ROUND(AVG(u.duration_seconds) / 60.0, 1) as avg_duration_minutes
            FROM main_staging.stg_product_usage u
            GROUP BY u.feature_name
            ORDER BY total_events DESC;
        """).df().to_dict(orient="records")

        return {
            "feature_summary": feature_summary,
            "product_usage_benchmarks": product_usage
        }

    def analyze_acquisition_and_contracts(self, con) -> dict:
        """8, 9, 10. Acquisition Channels, Contract Types, and Subscription Plans."""
        channels = con.execute("""
            SELECT 
                acquisition_channel,
                COUNT(*) as total_signups,
                SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END) as active_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_customers,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(SUM(current_mrr), 2) as active_mrr,
                ROUND(SUM(current_mrr) / NULLIF(SUM(CASE WHEN customer_status = 'active' THEN 1 ELSE 0 END), 0), 2) as arpu,
                ROUND(AVG(lifetime_billed_revenue), 2) as avg_realized_clv
            FROM main_marts.mart_customer_360
            GROUP BY acquisition_channel
            ORDER BY total_signups DESC;
        """).df().to_dict(orient="records")

        contracts = con.execute("""
            SELECT 
                contract_type,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_customers,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(SUM(current_arr), 2) as total_arr,
                ROUND(AVG(lifetime_billed_revenue), 2) as avg_clv
            FROM main_marts.mart_customer_360
            GROUP BY contract_type
            ORDER BY total_customers DESC;
        """).df().to_dict(orient="records")

        plans = con.execute("""
            SELECT 
                plan_tier,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned_customers,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(AVG(current_mrr), 2) as avg_mrr,
                ROUND(SUM(current_arr), 2) as total_arr
            FROM main_marts.mart_customer_360
            GROUP BY plan_tier
            ORDER BY total_arr DESC;
        """).df().to_dict(orient="records")

        return {
            "acquisition_channels": channels,
            "contract_types": contracts,
            "plans": plans
        }

    def analyze_bivariate_churn_drivers(self, con) -> dict:
        """
        Deep-dive into 9 required bivariate relationships:
        tenure, contract, price, engagement, support, payment failures, plan, acquisition channel, geography.
        """
        # 1. Churn vs Price (MRR quartiles)
        churn_price = con.execute("""
            WITH binned AS (
                SELECT 
                    customer_id,
                    is_churned,
                    current_mrr,
                    NTILE(4) OVER (ORDER BY current_mrr) as price_quartile
                FROM main_marts.mart_customer_360
            )
            SELECT 
                price_quartile,
                ROUND(MIN(current_mrr), 2) as min_mrr,
                ROUND(MAX(current_mrr), 2) as max_mrr,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct
            FROM binned
            GROUP BY price_quartile
            ORDER BY price_quartile;
        """).df().to_dict(orient="records")

        # 2. Churn vs Payment Delinquency
        churn_payment = con.execute("""
            SELECT 
                has_payment_delinquency,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct,
                ROUND(SUM(current_arr), 2) as arr_exposure
            FROM main_marts.mart_customer_360
            GROUP BY has_payment_delinquency;
        """).df().to_dict(orient="records")

        # 3. Churn vs Declining Engagement
        churn_engagement = con.execute("""
            SELECT 
                is_engagement_declining,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct
            FROM main_marts.mart_customer_360
            GROUP BY is_engagement_declining;
        """).df().to_dict(orient="records")

        # 4. Churn vs Support Friction
        churn_support = con.execute("""
            SELECT 
                has_support_friction,
                COUNT(*) as total_customers,
                SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) as churned,
                ROUND(SUM(CASE WHEN is_churned THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as churn_rate_pct
            FROM main_marts.mart_customer_360
            GROUP BY has_support_friction;
        """).df().to_dict(orient="records")

        return {
            "churn_vs_price": churn_price,
            "churn_vs_payment": churn_payment,
            "churn_vs_engagement": churn_engagement,
            "churn_vs_support": churn_support,
        }

    def generate_all_visualizations(self, con) -> dict:
        """Renders publication-ready visualizations for the investigation layer."""
        df = con.execute("SELECT * FROM main_marts.mart_customer_360;").df()
        df["churn_num"] = df["is_churned"].astype(int)

        # 1. Churn Drivers Summary Matrix
        fig, axes = plt.subplots(2, 2, figsize=(15, 12), dpi=300)
        sns.set_theme(style="whitegrid")

        # Contract Type vs Churn
        contract_agg = df.groupby("contract_type")["churn_num"].agg(["count", "mean"]).reset_index()
        contract_agg["mean"] *= 100.0
        sns.barplot(data=contract_agg, x="contract_type", y="mean", hue="contract_type", ax=axes[0, 0], palette="Blues_r", legend=False)
        axes[0, 0].set_title("Churn Rate by Contract Type (%)", fontsize=13, fontweight="bold")
        axes[0, 0].set_ylabel("Churn Rate (%)")
        axes[0, 0].set_ylim(0, 60)
        for p in axes[0, 0].patches:
            axes[0, 0].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 1),
                                ha='center', va='bottom', fontsize=10, fontweight='bold')

        # Plan Tier vs Churn
        tier_agg = df.groupby("plan_tier")["churn_num"].agg(["count", "mean"]).reset_index()
        tier_agg["mean"] *= 100.0
        sns.barplot(data=tier_agg, x="plan_tier", y="mean", hue="plan_tier", ax=axes[0, 1], palette="Purples_r", order=["Starter", "Growth", "Professional", "Enterprise"], legend=False)
        axes[0, 1].set_title("Churn Rate by Plan Tier (%)", fontsize=13, fontweight="bold")
        axes[0, 1].set_ylabel("Churn Rate (%)")
        axes[0, 1].set_ylim(0, 50)
        for p in axes[0, 1].patches:
            axes[0, 1].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 1),
                                ha='center', va='bottom', fontsize=10, fontweight='bold')

        # Acquisition Channel vs Churn
        channel_agg = df.groupby("acquisition_channel")["churn_num"].agg(["count", "mean"]).reset_index()
        channel_agg["mean"] *= 100.0
        channel_agg = channel_agg.sort_values(by="mean", ascending=False)
        sns.barplot(data=channel_agg, x="acquisition_channel", y="mean", hue="acquisition_channel", ax=axes[1, 0], palette="Oranges_r", legend=False)
        axes[1, 0].set_title("Churn Rate by Acquisition Channel (%)", fontsize=13, fontweight="bold")
        axes[1, 0].set_ylabel("Churn Rate (%)")
        axes[1, 0].set_xticks(range(len(channel_agg)))
        axes[1, 0].set_xticklabels(channel_agg["acquisition_channel"], rotation=20, ha='right')
        axes[1, 0].set_ylim(0, 50)
        for p in axes[1, 0].patches:
            axes[1, 0].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 1),
                                ha='center', va='bottom', fontsize=10, fontweight='bold')

        # Tenure vs Churn Hazard
        df["tenure_group"] = pd.cut(df["tenure_months"], bins=[0, 3, 6, 12, 24, 60], labels=["0-3 mo", "4-6 mo", "7-12 mo", "13-24 mo", "25+ mo"])
        tenure_agg = df.groupby("tenure_group", observed=False)["churn_num"].agg(["count", "mean"]).reset_index()
        tenure_agg["mean"] *= 100.0
        sns.barplot(data=tenure_agg, x="tenure_group", y="mean", hue="tenure_group", ax=axes[1, 1], palette="Reds_r", legend=False)
        axes[1, 1].set_title("Churn Rate across Customer Tenure (%)", fontsize=13, fontweight="bold")
        axes[1, 1].set_ylabel("Churn Rate (%)")
        axes[1, 1].set_ylim(0, 60)
        for p in axes[1, 1].patches:
            axes[1, 1].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 1),
                                ha='center', va='bottom', fontsize=10, fontweight='bold')

        plt.suptitle("Customer360 - Multidimensional Churn Drivers Matrix", fontsize=16, fontweight="bold", y=0.99)
        plt.tight_layout()
        churn_matrix_png = os.path.join(FIG_DIR, "churn_drivers_matrix.png")
        plt.savefig(churn_matrix_png, dpi=300)
        plt.close()

        # 2. Interactive Sunburst of Revenue & Churn by Plan and Contract (Plotly)
        fig_sunburst = px.sunburst(
            df,
            path=["plan_tier", "contract_type", "customer_status"],
            values="current_arr",
            color="customer_status",
            color_discrete_map={"active": "#10b981", "churned": "#ef4444"},
            title="<b>Customer360: Hierarchical ARR Breakdown</b><br><sup>Plan Tier → Contract Type → Customer Status</sup>"
        )
        fig_sunburst.update_layout(template="plotly_white", width=900, height=700)
        sunburst_html = os.path.join(FIG_DIR, "revenue_sunburst.html")
        fig_sunburst.write_html(sunburst_html)

        return {
            "churn_matrix_png": churn_matrix_png,
            "sunburst_html": sunburst_html
        }

    def run_all(self) -> dict:
        con = self.get_connection()
        demographics = self.analyze_demographics(con)
        revenue = self.analyze_revenue(con)
        churn_retention = self.analyze_churn_and_retention(con)
        engagement_support = self.analyze_engagement_and_support(con)
        product_usage = self.analyze_product_usage(con)
        acquisition_contracts = self.analyze_acquisition_and_contracts(con)
        bivariate = self.analyze_bivariate_churn_drivers(con)
        viz = self.generate_all_visualizations(con)
        con.close()

        return {
            "demographics": demographics,
            "revenue": revenue,
            "churn_retention": churn_retention,
            "engagement_support": engagement_support,
            "product_usage": product_usage,
            "acquisition_contracts": acquisition_contracts,
            "bivariate": bivariate,
            "viz": viz
        }


if __name__ == "__main__":
    investigator = DeepDiveInvestigator()
    report_data = investigator.run_all()
    print("Deep Dive Investigation Complete.")
    print("Executive KPIs:", report_data["revenue"]["executive_kpis"])
