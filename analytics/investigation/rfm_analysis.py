"""
Customer360 - RFM Segmentation Investigation
=============================================
Calculates Recency, Frequency, and Monetary metrics across all customers.
Performs quantitative quintile binning (1-5), assigns authoritative
behavioral segments, and outputs statistical profiles and visualizations.
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


class RFMAnalysis:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(FIG_DIR, exist_ok=True)

    def load_customer_rfm_data(self) -> pd.DataFrame:
        """Extracts customer behavioral and transaction attributes from unified mart."""
        con = duckdb.connect(self.db_path, read_only=True)
        query = """
        SELECT 
            c.customer_id,
            c.full_name,
            c.country,
            c.plan_name,
            c.plan_tier,
            c.contract_type,
            c.customer_status,
            CASE WHEN c.customer_status = 'active' THEN 1 ELSE 0 END AS is_active,
            CASE WHEN c.is_churned THEN 1 ELSE 0 END AS is_churned,
            c.current_mrr,
            c.current_arr,
            c.tenure_months,
            COALESCE(s.recency_days, 999) AS recency_days,
            COALESCE(s.frequency_sessions, c.total_sessions, 0) AS frequency_sessions,
            COALESCE(s.monetary_spend, c.lifetime_billed_revenue, 0.0) AS monetary_revenue,
            c.is_engagement_declining,
            c.has_support_friction,
            c.has_payment_delinquency
        FROM main_marts.mart_customer_360 c
        LEFT JOIN main_marts.mart_customer_segments s ON c.customer_id = s.customer_id;
        """
        df = con.execute(query).df()
        con.close()
        return df

    def compute_polars_rfm_scores(self, df: pd.DataFrame) -> pl.DataFrame:
        """
        Computes 1-5 quintile RFM scores using Polars expressions.
        R: 5 is best (lowest recency_days), 1 is worst (highest recency_days).
        F: 5 is best (highest frequency_sessions), 1 is worst.
        M: 5 is best (highest monetary_revenue), 1 is worst.
        """
        pldf = pl.from_pandas(df)
        
        # Calculate rank quantiles
        pldf = pldf.with_columns([
            # Recency: invert rank so lower days gets higher score
            ((1.0 - pl.col("recency_days").rank(method="average") / pl.len()) * 4 + 1).round().cast(pl.Int32).clip(1, 5).alias("r_score"),
            ((pl.col("frequency_sessions").rank(method="average") / pl.len()) * 4 + 1).round().cast(pl.Int32).clip(1, 5).alias("f_score"),
            ((pl.col("monetary_revenue").rank(method="average") / pl.len()) * 4 + 1).round().cast(pl.Int32).clip(1, 5).alias("m_score"),
        ])

        # Assign segments based on standardized scoring logic
        pldf = pldf.with_columns(
            pl.when(
                (pl.col("r_score") >= 4) & (pl.col("f_score") >= 4) & (pl.col("m_score") >= 4)
            ).then(pl.lit("Champions"))
            .when(
                (pl.col("r_score") >= 3) & (pl.col("f_score") >= 3) & (pl.col("m_score") >= 3)
            ).then(pl.lit("Loyal Customers"))
            .when(
                (pl.col("r_score") >= 4) & (pl.col("f_score") <= 3)
            ).then(pl.lit("Promising / New"))
            .when(
                (pl.col("r_score") <= 2) & (pl.col("f_score") >= 3) & (pl.col("m_score") >= 3)
            ).then(pl.lit("At Risk"))
            .when(
                (pl.col("r_score") == 1) & (pl.col("m_score") >= 4)
            ).then(pl.lit("Can't Lose Them"))
            .otherwise(pl.lit("Hibernating / Dormant"))
            .alias("authoritative_rfm_segment")
        )

        return pldf

    def summarize_segments(self, pldf: pl.DataFrame) -> pd.DataFrame:
        """Aggregates business metrics by RFM segment."""
        summary = (
            pldf.group_by("authoritative_rfm_segment")
            .agg([
                pl.len().alias("customer_count"),
                pl.col("is_active").sum().alias("active_count"),
                pl.col("is_churned").sum().alias("churned_count"),
                (pl.col("is_churned").sum() / pl.len() * 100.0).round(2).alias("churn_rate_pct"),
                pl.col("current_arr").sum().round(2).alias("total_active_arr"),
                pl.col("monetary_revenue").sum().round(2).alias("total_realized_revenue"),
                pl.col("monetary_revenue").mean().round(2).alias("avg_clv"),
                pl.col("recency_days").mean().round(1).alias("avg_recency_days"),
                pl.col("frequency_sessions").mean().round(1).alias("avg_frequency_sessions"),
            ])
            .sort("total_active_arr", descending=True)
        )
        return summary.to_pandas()

    def generate_segment_visualizations(self, pldf: pl.DataFrame, summary_df: pd.DataFrame) -> dict:
        """Produces Matplotlib bar chart and Plotly 3D scatter plot."""
        pdf = pldf.to_pandas()

        # 1. Matplotlib Segment Breakdown Chart
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6), dpi=300)
        sns.set_theme(style="whitegrid")

        # Plot 1: ARR Contribution by Segment
        bars1 = ax1.bar(
            summary_df["authoritative_rfm_segment"], 
            summary_df["total_active_arr"] / 1000.0, 
            color="#1e3a8a", 
            edgecolor="#0f172a"
        )
        ax1.set_title("Active ARR by RFM Segment ($K)", fontsize=14, fontweight="bold")
        ax1.set_ylabel("ARR ($ in Thousands)", fontsize=12)
        ax1.set_xticks(range(len(summary_df)))
        ax1.set_xticklabels(summary_df["authoritative_rfm_segment"], rotation=25, ha="right")
        for bar in bars1:
            yval = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 5, f"${yval:.1f}k", ha="center", va="bottom", fontsize=10, fontweight="bold")

        # Plot 2: Churn Rate % by Segment
        bars2 = ax2.bar(
            summary_df["authoritative_rfm_segment"], 
            summary_df["churn_rate_pct"], 
            color="#dc2626", 
            edgecolor="#7f1d1d"
        )
        ax2.set_title("Churn Rate (%) by RFM Segment", fontsize=14, fontweight="bold")
        ax2.set_ylabel("Churn Rate (%)", fontsize=12)
        ax2.set_ylim(0, 100)
        ax2.set_xticks(range(len(summary_df)))
        ax2.set_xticklabels(summary_df["authoritative_rfm_segment"], rotation=25, ha="right")
        for bar in bars2:
            yval = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 1.5, f"{yval:.1f}%", ha="center", va="bottom", fontsize=10, fontweight="bold")

        plt.suptitle("Customer360 - RFM Segment Performance & Revenue Risk", fontsize=16, fontweight="bold")
        plt.tight_layout()
        
        png_path = os.path.join(FIG_DIR, "rfm_segments_distribution.png")
        plt.savefig(png_path, dpi=300)
        plt.close()

        # 2. Plotly 3D Interactive RFM Scatter
        fig_3d = px.scatter_3d(
            pdf,
            x="recency_days",
            y="frequency_sessions",
            z="monetary_revenue",
            color="authoritative_rfm_segment",
            hover_name="full_name",
            hover_data=["customer_id", "plan_name", "customer_status", "current_mrr"],
            title="<b>Customer360: 3D RFM Customer Landscape</b><br><sup>Recency (Days) vs Frequency (Sessions) vs Monetary ($)</sup>",
            labels={
                "recency_days": "Recency (Days Ago)",
                "frequency_sessions": "Frequency (Lifetime Sessions)",
                "monetary_revenue": "Monetary ($ Realized Revenue)"
            },
            color_discrete_sequence=px.colors.qualitative.Bold,
            opacity=0.85
        )
        fig_3d.update_layout(
            template="plotly_white",
            width=1000,
            height=700,
            scene=dict(
                xaxis=dict(backgroundcolor="#f8fafc"),
                yaxis=dict(backgroundcolor="#f8fafc"),
                zaxis=dict(backgroundcolor="#f8fafc"),
            )
        )
        html_path = os.path.join(FIG_DIR, "rfm_3d_scatter.html")
        fig_3d.write_html(html_path)

        return {"png_path": png_path, "html_path": html_path}

    def run(self) -> dict:
        """Executes full RFM workflow."""
        raw_df = self.load_customer_rfm_data()
        pldf = self.compute_polars_rfm_scores(raw_df)
        summary_df = self.summarize_segments(pldf)
        viz_paths = self.generate_segment_visualizations(pldf, summary_df)

        return {
            "summary": summary_df.to_dict(orient="records"),
            "viz": viz_paths,
            "total_customers": len(raw_df)
        }


if __name__ == "__main__":
    rfm = RFMAnalysis()
    res = rfm.run()
    print("RFM Analysis Complete.")
    print(pd.DataFrame(res["summary"]))
