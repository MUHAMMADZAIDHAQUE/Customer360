"""
Customer360 - Cohort Retention Investigation
=============================================
Calculates signup-month cohorts, Month 1-12 retention rates,
and produces publication-quality heatmaps and survival curves.
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


class CohortAnalysis:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(FIG_DIR, exist_ok=True)

    def load_cohort_pivot(self) -> pd.DataFrame:
        """Loads and pivots long-form cohort retention mart from DuckDB into triangular matrix."""
        con = duckdb.connect(self.db_path, read_only=True)
        query = """
        SELECT 
            strftime(cohort_month, '%Y-%m') as cohort_month,
            MAX(cohort_size) as cohort_size,
            MAX(CASE WHEN month_number = 0 THEN retention_rate_pct END) as retention_pct_month_0,
            MAX(CASE WHEN month_number = 1 THEN retention_rate_pct END) as retention_pct_month_1,
            MAX(CASE WHEN month_number = 2 THEN retention_rate_pct END) as retention_pct_month_2,
            MAX(CASE WHEN month_number = 3 THEN retention_rate_pct END) as retention_pct_month_3,
            MAX(CASE WHEN month_number = 4 THEN retention_rate_pct END) as retention_pct_month_4,
            MAX(CASE WHEN month_number = 5 THEN retention_rate_pct END) as retention_pct_month_5,
            MAX(CASE WHEN month_number = 6 THEN retention_rate_pct END) as retention_pct_month_6,
            MAX(CASE WHEN month_number = 7 THEN retention_rate_pct END) as retention_pct_month_7,
            MAX(CASE WHEN month_number = 8 THEN retention_rate_pct END) as retention_pct_month_8,
            MAX(CASE WHEN month_number = 9 THEN retention_rate_pct END) as retention_pct_month_9,
            MAX(CASE WHEN month_number = 10 THEN retention_rate_pct END) as retention_pct_month_10,
            MAX(CASE WHEN month_number = 11 THEN retention_rate_pct END) as retention_pct_month_11,
            MAX(CASE WHEN month_number = 12 THEN retention_rate_pct END) as retention_pct_month_12
        FROM main_marts.mart_cohort_retention
        GROUP BY strftime(cohort_month, '%Y-%m')
        ORDER BY cohort_month;
        """
        df = con.execute(query).df()
        con.close()
        return df

    def compute_polars_cohort_matrix(self) -> pl.DataFrame:
        """Demonstrates fast Polars cohort processing directly from raw Parquet data."""
        parquet_cust = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/customers.parquet"))
        parquet_sub = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/subscriptions.parquet"))
        
        cust_df = pl.read_parquet(parquet_cust)
        sub_df = pl.read_parquet(parquet_sub)

        # Join customer signup with subscription timeline
        joined = cust_df.join(sub_df, on="customer_id", how="inner")
        
        cohort_summary = (
            joined.with_columns([
                pl.col("signup_date").dt.strftime("%Y-%m").alias("cohort_month"),
                (pl.col("status") == "active").cast(pl.Int32).alias("is_active_now")
            ])
            .group_by("cohort_month")
            .agg([
                pl.len().alias("cohort_size"),
                pl.col("is_active_now").sum().alias("current_retained"),
                (pl.col("is_active_now").sum() / pl.len() * 100.0).round(2).alias("current_retention_pct")
            ])
            .sort("cohort_month")
        )
        return cohort_summary

    def calculate_key_milestones(self, df: pd.DataFrame) -> dict:
        """Computes weighted average retention across cohorts for Month 1, 2, 3, 6, 12."""
        milestones = {}
        for m in [1, 2, 3, 6, 12]:
            col = f"retention_pct_month_{m}"
            valid_rows = df.dropna(subset=[col])
            if len(valid_rows) > 0 and valid_rows["cohort_size"].sum() > 0:
                weighted_avg = (valid_rows[col] * valid_rows["cohort_size"]).sum() / valid_rows["cohort_size"].sum()
                milestones[f"Month {m}"] = {
                    "cohorts_matured": len(valid_rows),
                    "mean_retention_pct": round(float(valid_rows[col].mean()), 2),
                    "weighted_retention_pct": round(float(weighted_avg), 2),
                    "min_retention_pct": round(float(valid_rows[col].min()), 2),
                    "max_retention_pct": round(float(valid_rows[col].max()), 2),
                }
        return milestones

    def generate_heatmap_matplotlib(self, df: pd.DataFrame) -> str:
        """Renders static high-resolution heatmap for reports using Matplotlib and Seaborn."""
        matrix_df = df.set_index("cohort_month").copy()
        pct_cols = [c for c in matrix_df.columns if c.startswith("retention_pct_month_")]
        matrix_data = matrix_df[pct_cols]
        matrix_data.columns = [f"M+{c.replace('retention_pct_month_', '')}" for c in pct_cols]

        plt.figure(figsize=(14, 8), dpi=300)
        sns.set_theme(style="white")
        
        ax = sns.heatmap(
            matrix_data,
            annot=True,
            fmt=".1f",
            cmap="YlGnBu",
            vmin=30.0,
            vmax=100.0,
            cbar_kws={'label': 'Customer Retention Rate (%)'},
            linewidths=0.8,
            linecolor='#f0f2f5'
        )
        
        plt.title("Customer360 - Signup Cohort Retention Heatmap (Months 0 - 12)", fontsize=16, fontweight='bold', pad=15)
        plt.xlabel("Months Since Signup (Cohort Tenure)", fontsize=12, labelpad=10)
        plt.ylabel("Signup Cohort (Month)", fontsize=12, labelpad=10)
        plt.tight_layout()
        
        out_path = os.path.join(FIG_DIR, "cohort_retention_heatmap.png")
        plt.savefig(out_path, dpi=300)
        plt.close()
        return out_path

    def generate_interactive_plotly(self, df: pd.DataFrame) -> str:
        """Renders interactive HTML heatmap with Plotly."""
        matrix_df = df.set_index("cohort_month").copy()
        pct_cols = [c for c in matrix_df.columns if c.startswith("retention_pct_month_")]
        z_values = matrix_df[pct_cols].values
        x_labels = [f"Month {c.replace('retention_pct_month_', '')}" for c in pct_cols]
        y_labels = matrix_df.index.tolist()

        fig = go.Figure(data=go.Heatmap(
            z=z_values,
            x=x_labels,
            y=y_labels,
            colorscale='Blues',
            colorbar=dict(title='Retention %'),
            text=[[f"{val:.1f}%" if not np.isnan(val) else "" for val in row] for row in z_values],
            texttemplate="%{text}",
            textfont={"size": 11},
            hoverongaps=False
        ))

        fig.update_layout(
            title="<b>Customer360: Interactive Cohort Retention Matrix</b><br><sup>Triangular cohort analysis tracking monthly subscriber retention</sup>",
            xaxis_title="Tenure (Months Elapsed)",
            yaxis_title="Cohort Signup Month",
            template="plotly_white",
            width=1000,
            height=650
        )

        out_path = os.path.join(FIG_DIR, "cohort_retention_heatmap.html")
        fig.write_html(out_path)
        return out_path

    def run(self) -> dict:
        """Executes full cohort investigation."""
        mart_df = self.load_cohort_pivot()
        polars_summary = self.compute_polars_cohort_matrix()
        milestones = self.calculate_key_milestones(mart_df)
        png_path = self.generate_heatmap_matplotlib(mart_df)
        html_path = self.generate_interactive_plotly(mart_df)

        return {
            "milestones": milestones,
            "png_path": png_path,
            "html_path": html_path,
            "cohort_count": len(mart_df),
            "polars_cohort_summary": polars_summary.to_dicts()
        }


if __name__ == "__main__":
    analyzer = CohortAnalysis()
    results = analyzer.run()
    print("Cohort Analysis Complete.")
    print("Milestones:", results["milestones"])
