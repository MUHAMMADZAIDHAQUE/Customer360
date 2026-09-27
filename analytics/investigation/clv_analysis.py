"""
Customer360 - Customer Lifetime Value (CLV) Investigation
==========================================================
Calculates Historical (Observed) CLV and Estimated Forward-Looking CLV.
Strictly distinguishes observed revenue from predictive projections.
Uses: SQL, Polars, Pandas, Matplotlib, Plotly.
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


class CLVAnalysis:
    def __init__(self, db_path: str = DB_PATH, gross_margin: float = 0.80):
        self.db_path = db_path
        self.gross_margin = gross_margin  # Typical B2B SaaS gross margin (80%)
        os.makedirs(FIG_DIR, exist_ok=True)

    def load_customer_financials(self) -> pd.DataFrame:
        """Loads customer transactions, status, current MRR, and plan metadata."""
        con = duckdb.connect(self.db_path, read_only=True)
        query = """
        SELECT 
            c.customer_id,
            c.full_name,
            c.country,
            c.acquisition_channel,
            c.plan_name,
            c.plan_tier,
            c.contract_type,
            c.customer_status,
            CASE WHEN c.customer_status = 'active' THEN 1 ELSE 0 END AS is_active,
            CASE WHEN c.is_churned THEN 1 ELSE 0 END AS is_churned,
            c.tenure_months,
            c.current_mrr,
            c.current_arr,
            c.lifetime_billed_revenue AS observed_clv,
            c.total_invoices_count AS total_invoices,
            c.has_payment_delinquency,
            c.is_engagement_declining,
            c.has_support_friction
        FROM main_marts.mart_customer_360 c
        ORDER BY c.lifetime_billed_revenue DESC;
        """
        df = con.execute(query).df()
        con.close()
        return df

    def compute_plan_churn_rates(self, df: pd.DataFrame) -> dict:
        """Computes empirical monthly churn rates by plan tier to parameterize forward CLV."""
        plan_churn = {}
        for tier, grp in df.groupby("plan_tier"):
            total_months = grp["tenure_months"].sum()
            churns = grp["is_churned"].sum()
            # Monthly hazard rate: churns / total customer-months observed
            monthly_hazard = churns / total_months if total_months > 0 else 0.05
            # Bound hazard between 1.5% and 15% monthly
            bounded_hazard = float(np.clip(monthly_hazard, 0.015, 0.15))
            plan_churn[tier] = bounded_hazard
        return plan_churn

    def compute_clv_metrics(self, df: pd.DataFrame) -> pl.DataFrame:
        """
        Calculates:
        1. Observed CLV: Actual cash realized to date from settled invoices.
        2. Expected Remaining Life (months):
           - 0 for churned accounts.
           - Active accounts: 1 / monthly_hazard_rate, discounted for contract commitment and engagement risk.
        3. Estimated Remaining Value ($):
           - Expected Remaining Life * Current MRR * Gross Margin.
        4. Total Projected CLV ($):
           - Observed CLV + Estimated Remaining Value.
        """
        plan_hazards = self.compute_plan_churn_rates(df)
        pldf = pl.from_pandas(df)

        # Apply hazard rates
        clv_df = pldf.with_columns([
            pl.col("plan_tier").replace(plan_hazards, default=0.04).cast(pl.Float64).alias("monthly_churn_rate")
        ])

        # Calculate expected remaining months
        clv_df = clv_df.with_columns(
            pl.when(pl.col("is_churned") == 1)
            .then(pl.lit(0.0))
            .otherwise(
                pl.when(pl.col("contract_type") == "multi_year")
                .then(pl.lit(36.0))
                .when(pl.col("contract_type") == "annual")
                .then(pl.lit(18.0))
                .otherwise((1.0 / pl.col("monthly_churn_rate")).clip(3.0, 36.0))
            )
            .alias("expected_remaining_months")
        )

        # Adjust remaining life for active friction flags (-30% if engagement declining, -20% if support friction)
        clv_df = clv_df.with_columns(
            pl.when(pl.col("is_active") == 1)
            .then(
                pl.col("expected_remaining_months") *
                pl.when(pl.col("is_engagement_declining") == 1).then(0.7).otherwise(1.0) *
                pl.when(pl.col("has_support_friction") == 1).then(0.8).otherwise(1.0) *
                pl.when(pl.col("has_payment_delinquency") == 1).then(0.6).otherwise(1.0)
            )
            .otherwise(pl.lit(0.0))
            .alias("risk_adjusted_remaining_months")
        )

        # Compute remaining projected revenue and total projected CLV
        clv_df = clv_df.with_columns([
            (pl.col("risk_adjusted_remaining_months") * pl.col("current_mrr") * self.gross_margin).round(2).alias("estimated_remaining_clv"),
        ]).with_columns([
            (pl.col("observed_clv") + pl.col("estimated_remaining_clv")).round(2).alias("total_projected_clv")
        ])

        return clv_df

    def summarize_clv_by_segment(self, clv_df: pl.DataFrame) -> dict:
        """Computes summary statistics distinguishing observed vs projected CLV."""
        total_observed = float(clv_df["observed_clv"].sum())
        total_projected_remaining = float(clv_df["estimated_remaining_clv"].sum())
        total_projected_lifetime = float(clv_df["total_projected_clv"].sum())

        plan_summary = (
            clv_df.group_by("plan_tier")
            .agg([
                pl.len().alias("customer_count"),
                pl.col("is_active").sum().alias("active_customers"),
                pl.col("observed_clv").mean().round(2).alias("mean_observed_clv"),
                pl.col("observed_clv").median().round(2).alias("median_observed_clv"),
                pl.col("estimated_remaining_clv").mean().round(2).alias("mean_remaining_clv"),
                pl.col("total_projected_clv").mean().round(2).alias("mean_projected_clv"),
                pl.col("total_projected_clv").median().round(2).alias("median_projected_clv"),
                pl.col("total_projected_clv").sum().round(2).alias("total_tier_clv_value"),
            ])
            .sort("mean_projected_clv", descending=True)
        )

        contract_summary = (
            clv_df.group_by("contract_type")
            .agg([
                pl.len().alias("customer_count"),
                pl.col("observed_clv").mean().round(2).alias("mean_observed_clv"),
                pl.col("total_projected_clv").mean().round(2).alias("mean_projected_clv"),
                pl.col("total_projected_clv").sum().round(2).alias("total_contract_clv_value"),
            ])
            .sort("mean_projected_clv", descending=True)
        )

        return {
            "overall": {
                "total_customers": len(clv_df),
                "total_observed_clv": round(total_observed, 2),
                "mean_observed_clv": round(float(clv_df["observed_clv"].mean()), 2),
                "median_observed_clv": round(float(clv_df["observed_clv"].median()), 2),
                "total_projected_remaining_clv": round(total_projected_remaining, 2),
                "total_projected_lifetime_value": round(total_projected_lifetime, 2),
                "mean_projected_clv": round(float(clv_df["total_projected_clv"].mean()), 2),
                "median_projected_clv": round(float(clv_df["total_projected_clv"].median()), 2),
            },
            "plan_summary": plan_summary.to_dicts(),
            "contract_summary": contract_summary.to_dicts()
        }

    def generate_clv_visualizations(self, clv_df: pl.DataFrame) -> dict:
        """Generates distribution plots and interactive boxplots comparing Observed vs Projected CLV."""
        pdf = clv_df.to_pandas()

        # 1. Matplotlib Distribution Plot: Observed vs Projected CLV
        plt.figure(figsize=(14, 6), dpi=300)
        sns.set_theme(style="whitegrid")

        plt.subplot(1, 2, 1)
        sns.histplot(pdf["observed_clv"], bins=30, kde=True, color="#2563eb", alpha=0.6)
        plt.axvline(pdf["observed_clv"].mean(), color="#1e3a8a", linestyle="--", linewidth=2, label=f"Mean: ${pdf['observed_clv'].mean():,.0f}")
        plt.axvline(pdf["observed_clv"].median(), color="#0f172a", linestyle=":", linewidth=2, label=f"Median: ${pdf['observed_clv'].median():,.0f}")
        plt.title("Observed Historical CLV Distribution ($)", fontsize=13, fontweight="bold")
        plt.xlabel("Historical Realized Revenue ($)")
        plt.ylabel("Customer Count")
        plt.legend()

        plt.subplot(1, 2, 2)
        sns.histplot(pdf["total_projected_clv"], bins=30, kde=True, color="#10b981", alpha=0.6)
        plt.axvline(pdf["total_projected_clv"].mean(), color="#065f46", linestyle="--", linewidth=2, label=f"Mean: ${pdf['total_projected_clv'].mean():,.0f}")
        plt.axvline(pdf["total_projected_clv"].median(), color="#022c22", linestyle=":", linewidth=2, label=f"Median: ${pdf['total_projected_clv'].median():,.0f}")
        plt.title("Total Projected Lifetime Value (Observed + Remaining)", fontsize=13, fontweight="bold")
        plt.xlabel("Projected CLV ($)")
        plt.ylabel("Customer Count")
        plt.legend()

        plt.suptitle("Customer360 - Historical Observed vs. Risk-Adjusted Projected CLV", fontsize=15, fontweight="bold")
        plt.tight_layout()
        png_path = os.path.join(FIG_DIR, "clv_distribution.png")
        plt.savefig(png_path, dpi=300)
        plt.close()

        # 2. Plotly Interactive Box Plot by Plan Tier
        fig = px.box(
            pdf,
            x="plan_tier",
            y="total_projected_clv",
            color="customer_status",
            notched=True,
            category_orders={"plan_tier": ["Starter", "Growth", "Professional", "Enterprise"]},
            title="<b>Customer360: Projected CLV Distribution Across Plan Tiers</b><br><sup>Segmented by Active vs Churned Status (Log-Scale Visualization)</sup>",
            labels={"total_projected_clv": "Projected CLV ($)", "plan_tier": "Subscription Plan Tier", "customer_status": "Customer Status"},
            color_discrete_map={"active": "#10b981", "churned": "#ef4444"},
            log_y=True
        )
        fig.update_layout(template="plotly_white", width=950, height=600)
        html_path = os.path.join(FIG_DIR, "clv_by_plan.html")
        fig.write_html(html_path)

        return {"png_path": png_path, "html_path": html_path}

    def run(self) -> dict:
        """Executes full CLV pipeline."""
        df = self.load_customer_financials()
        clv_df = self.compute_clv_metrics(df)
        summary = self.summarize_clv_by_segment(clv_df)
        viz = self.generate_clv_visualizations(clv_df)
        return {"summary": summary, "viz": viz}


if __name__ == "__main__":
    clv = CLVAnalysis()
    res = clv.run()
    print("CLV Analysis Complete.")
    print("Overall CLV Summary:", res["summary"]["overall"])
