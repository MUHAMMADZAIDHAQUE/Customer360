"""Customer360 Database Initializer and Ingest Engine.

Initializes PostgreSQL schemas, tables, constraints, and indexes,
and loads synthetic dataset into relational tables.
Also supports fallback to DuckDB/SQLite for local environments where
PostgreSQL service is pending container startup.
"""

import os
import sys
from typing import Dict
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from api.config import get_settings
DATA_RAW = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED = os.path.join(BASE_DIR, "data", "processed")
SCHEMA_SQL = os.path.join(BASE_DIR, "database", "schema.sql")
INDEXES_SQL = os.path.join(BASE_DIR, "database", "indexes.sql")


def load_raw_data() -> Dict[str, pd.DataFrame]:
    """Load generated raw CSV files into pandas DataFrames."""
    tables = [
        "plans", "customers", "subscriptions", "transactions",
        "payments", "support_tickets", "customer_engagement",
        "product_usage", "churn_events"
    ]
    dfs = {}
    for table in tables:
        path = os.path.join(DATA_RAW, f"{table}.csv")
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Dataset {path} not found. Please run: python data/generate_dataset.py"
            )
        dfs[table] = pd.read_csv(path)
    return dfs


def initialize_postgres(db_url: str = None) -> bool:
    """Initialize PostgreSQL database tables, indexes, and load data."""
    settings = get_settings()
    url = db_url or settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    print(f"Connecting to PostgreSQL at: {url} ...")
    try:
        engine = create_engine(url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            # Execute schema DDL
            with open(SCHEMA_SQL, "r") as f:
                schema_ddl = f.read()
            print("Applying database schema DDL...")
            for statement in schema_ddl.split(";"):
                stmt = statement.strip()
                if stmt:
                    conn.execute(text(stmt))

            # Execute indexes
            with open(INDEXES_SQL, "r") as f:
                indexes_ddl = f.read()
            print("Applying performance indexes...")
            for statement in indexes_ddl.split(";"):
                stmt = statement.strip()
                if stmt:
                    conn.execute(text(stmt))

        print("Loading data into PostgreSQL tables...")
        dfs = load_raw_data()
        with engine.connect() as conn:
            for name, df in dfs.items():
                print(f"  Ingesting {name} ({len(df):,} rows)...")
                df.to_sql(
                    name=name,
                    con=engine,
                    schema="customer360",
                    if_exists="append",
                    index=False,
                    chunksize=1000
                )

        print("\nPostgreSQL initialization and data ingest complete!")
        return True

    except Exception as e:
        print(f"\n[Notice] Could not connect to PostgreSQL: {e}")
        print("To run PostgreSQL, launch Docker Compose or local Postgres:")
        print("  docker compose up -d postgres")
        print("Continuing with local DuckDB analytical engine...\n")
        return False


def verify_sample_queries(engine_type: str = "duckdb") -> None:
    """Execute sample relational queries demonstrating multi-table join capabilities."""
    from analytics.duckdb_client import DuckDBClient

    print("\n=======================================================")
    print("Executing Sample Business Queries on Analytical Engine")
    print("=======================================================")

    client = DuckDBClient()
    client.register_parquet_views()

    # Query 1: Active vs Churned ARR & Customer Count
    q1 = """
        SELECT 
            c.customer_status,
            COUNT(DISTINCT c.customer_id) AS total_customers,
            ROUND(SUM(s.monthly_price * 12), 2) AS total_arr,
            ROUND(AVG(s.monthly_price), 2) AS avg_monthly_mrr
        FROM customers c
        JOIN subscriptions s ON c.customer_id = s.customer_id
        GROUP BY c.customer_status
        ORDER BY total_customers DESC;
    """
    print("\n--- 1. Customer Status & ARR Distribution ---")
    print(client.query(q1).to_string(index=False))

    # Query 2: Churn Reason Breakdown
    q2 = """
        SELECT 
            churn_reason,
            churn_type,
            COUNT(*) AS churn_count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_of_total_churn
        FROM churn_events
        GROUP BY churn_reason, churn_type
        ORDER BY churn_count DESC;
    """
    print("\n--- 2. Churn Reason & Type Attribution ---")
    print(client.query(q2).to_string(index=False))

    # Query 3: Multi-table relational query linking Engagement, Tickets, and Churn
    q3 = """
        SELECT 
            p.plan_name,
            ROUND(AVG(e.sessions), 1) AS avg_weekly_sessions,
            ROUND(AVG(e.session_duration), 1) AS avg_weekly_duration_mins,
            COUNT(DISTINCT t.ticket_id) AS total_tickets,
            COUNT(DISTINCT ch.churn_id) AS churned_subscriptions
        FROM plans p
        JOIN subscriptions s ON p.plan_id = s.plan_id
        JOIN customers c ON s.customer_id = c.customer_id
        LEFT JOIN customer_engagement e ON c.customer_id = e.customer_id
        LEFT JOIN support_tickets t ON c.customer_id = t.customer_id
        LEFT JOIN churn_events ch ON s.subscription_id = ch.subscription_id
        GROUP BY p.plan_name
        ORDER BY avg_weekly_sessions DESC;
    """
    print("\n--- 3. Plan Tier Engagement & Support Correlation ---")
    print(client.query(q3).to_string(index=False))
    client.close()


if __name__ == "__main__":
    pg_success = initialize_postgres()
    verify_sample_queries("postgres" if pg_success else "duckdb")
