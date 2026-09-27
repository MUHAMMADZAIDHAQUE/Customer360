"""DuckDB Analytical Querying Engine for Customer360.

Provides embedded, vectorized OLAP analytical querying directly over
Parquet files in data/processed/ without requiring heavy infrastructure.
"""

import os
from typing import Optional, List, Dict, Any
import duckdb
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PROCESSED = os.path.join(BASE_DIR, "data", "processed")
DUCKDB_PATH = os.path.join(DATA_PROCESSED, "customer360.duckdb")


class DuckDBClient:
    """Manages DuckDB connections and queries across Parquet storage."""

    def __init__(self, db_path: str = DUCKDB_PATH, read_only: bool = False):
        self.db_path = db_path
        self.read_only = read_only
        self._con: Optional[duckdb.DuckDBPyConnection] = None

    def connect(self) -> duckdb.DuckDBPyConnection:
        """Establish or return active DuckDB connection."""
        if self._con is None:
            self._con = duckdb.connect(database=self.db_path, read_only=self.read_only)
            try:
                self._con.execute("USE main_marts;")
            except Exception:
                pass
        return self._con

    def close(self) -> None:
        """Close connection if open."""
        if self._con:
            self._con.close()
            self._con = None

    def register_parquet_views(self) -> None:
        """Register all Parquet files in data/processed/ as SQL views."""
        con = self.connect()
        tables = [
            "plans", "customers", "subscriptions", "transactions",
            "payments", "support_tickets", "customer_engagement",
            "product_usage", "churn_events"
        ]

        for table in tables:
            parquet_file = os.path.join(DATA_PROCESSED, f"{table}.parquet")
            if os.path.exists(parquet_file):
                # Create permanent tables or replacement views in DuckDB
                con.execute(f"""
                    CREATE OR REPLACE VIEW main.{table} AS 
                    SELECT * FROM read_parquet('{parquet_file}');
                """)
        try:
            con.execute("USE main_marts;")
        except Exception:
            pass

    def query(self, sql: str) -> pd.DataFrame:
        """Execute arbitrary SQL query and return results as Pandas DataFrame."""
        con = self.connect()
        try:
            con.execute("USE main_marts;")
        except Exception:
            pass
        return con.execute(sql).df()

    def query_dict(self, sql: str) -> List[Dict[str, Any]]:
        """Execute arbitrary SQL query and return results as list of dictionaries."""
        df = self.query(sql)
        return df.to_dict(orient="records")

    # --------------------------------------------------------------------------
    # Pre-built Analytical Insights
    # --------------------------------------------------------------------------

    def get_churn_rate_by_plan(self) -> pd.DataFrame:
        """Analyze churn rate distribution across pricing tiers."""
        sql = """
            SELECT 
                p.plan_name,
                p.tier,
                COUNT(DISTINCT s.subscription_id) AS total_subscriptions,
                COUNT(DISTINCT c.churn_id) AS total_churned,
                ROUND(COUNT(DISTINCT c.churn_id) * 100.0 / COUNT(DISTINCT s.subscription_id), 2) AS churn_rate_pct,
                ROUND(AVG(s.monthly_price), 2) AS avg_monthly_price
            FROM plans p
            JOIN subscriptions s ON p.plan_id = s.plan_id
            LEFT JOIN churn_events c ON s.subscription_id = c.subscription_id
            GROUP BY p.plan_name, p.tier
            ORDER BY churn_rate_pct DESC;
        """
        return self.query(sql)

    def get_retention_by_contract_type(self) -> pd.DataFrame:
        """Calculate retention rates comparing monthly vs annual contracts."""
        sql = """
            SELECT 
                s.contract_type,
                COUNT(s.subscription_id) AS total_contracts,
                COUNT(c.churn_id) AS total_churned,
                ROUND((1.0 - (COUNT(c.churn_id) * 1.0 / COUNT(s.subscription_id))) * 100.0, 2) AS retention_rate_pct,
                ROUND(SUM(s.monthly_price * 12), 2) AS annualized_revenue
            FROM subscriptions s
            LEFT JOIN churn_events c ON s.subscription_id = c.subscription_id
            GROUP BY s.contract_type
            ORDER BY retention_rate_pct DESC;
        """
        return self.query(sql)

    def get_support_ticket_impact(self) -> pd.DataFrame:
        """Correlate satisfaction scores and resolution times with churn status."""
        sql = """
            SELECT 
                cust.customer_status,
                COUNT(DISTINCT t.ticket_id) AS total_tickets,
                ROUND(AVG(t.resolution_time), 2) AS avg_resolution_hours,
                ROUND(AVG(t.satisfaction_score), 2) AS avg_satisfaction_score,
                COUNT(CASE WHEN t.priority IN ('high', 'urgent') THEN 1 END) AS high_urgency_tickets
            FROM customers cust
            JOIN support_tickets t ON cust.customer_id = t.customer_id
            GROUP BY cust.customer_status;
        """
        return self.query(sql)

    def get_revenue_at_risk(self) -> pd.DataFrame:
        """Identify high-value customers at immediate risk due to low satisfaction or ticket volume."""
        sql = """
            SELECT 
                c.customer_id,
                c.first_name || ' ' || c.last_name AS customer_name,
                c.country,
                s.plan_id,
                s.monthly_price,
                ROUND(s.monthly_price * 12, 2) AS annual_arr_at_risk,
                COUNT(t.ticket_id) AS ticket_count,
                ROUND(AVG(t.satisfaction_score), 1) AS avg_satisfaction
            FROM customers c
            JOIN subscriptions s ON c.customer_id = s.customer_id
            JOIN support_tickets t ON c.customer_id = t.customer_id
            WHERE s.status = 'active'
            GROUP BY c.customer_id, c.first_name, c.last_name, c.country, s.plan_id, s.monthly_price
            HAVING AVG(t.satisfaction_score) <= 2.5 OR COUNT(t.ticket_id) >= 3
            ORDER BY annual_arr_at_risk DESC
            LIMIT 15;
        """
        return self.query(sql)


if __name__ == "__main__":
    client = DuckDBClient()
    client.register_parquet_views()
    print("DuckDB Parquet views registered successfully!")
    print("\n--- Churn Rate by Plan ---")
    print(client.get_churn_rate_by_plan())
    print("\n--- Retention by Contract Type ---")
    print(client.get_retention_by_contract_type())
    print("\n--- Support Ticket Correlation ---")
    print(client.get_support_ticket_impact())
    client.close()
