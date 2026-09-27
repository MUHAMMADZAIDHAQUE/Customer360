"""Customer360 Phase 1 Data Foundation Automated Test Suite.

Validates:
1. Existence of all 9 entity Parquet datasets in data/processed/
2. Schema structure, column names, and non-empty rows
3. DuckDB querying over Parquet files
4. Referential integrity and data quality gatekeeper checks
"""

import os
import pytest
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PROCESSED = os.path.join(BASE_DIR, "data", "processed")

REQUIRED_TABLES = [
    "plans", "customers", "subscriptions", "transactions",
    "payments", "support_tickets", "customer_engagement",
    "product_usage", "churn_events"
]


@pytest.mark.parametrize("table", REQUIRED_TABLES)
def test_parquet_file_exists_and_non_empty(table: str):
    """Verify each analytical Parquet file exists and contains rows."""
    file_path = os.path.join(DATA_PROCESSED, f"{table}.parquet")
    assert os.path.exists(file_path), f"Parquet file {file_path} does not exist"
    df = pd.read_parquet(file_path)
    assert len(df) > 0, f"Table {table} has 0 records"


def test_customer_schema_columns():
    """Verify customers table contains required analytical fields."""
    file_path = os.path.join(DATA_PROCESSED, "customers.parquet")
    df = pd.read_parquet(file_path)
    expected_cols = [
        "customer_id", "first_name", "last_name", "age", "gender",
        "country", "region", "city", "signup_date", "acquisition_channel", "customer_status"
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing required column {col} in customers"


def test_subscriptions_schema_columns():
    """Verify subscriptions table contains required contract & price fields."""
    file_path = os.path.join(DATA_PROCESSED, "subscriptions.parquet")
    df = pd.read_parquet(file_path)
    expected_cols = [
        "subscription_id", "customer_id", "plan_id", "contract_type",
        "start_date", "end_date", "monthly_price", "status"
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing required column {col} in subscriptions"


def test_transactions_amounts_and_types():
    """Verify transactions table has non-negative amounts and expected payment methods."""
    file_path = os.path.join(DATA_PROCESSED, "transactions.parquet")
    df = pd.read_parquet(file_path)
    assert (df["amount"] < 0).sum() == 0, "Found negative transaction amounts"
    assert "credit_card" in df["payment_method"].values


def test_support_tickets_columns_and_bounds():
    """Verify support tickets have valid satisfaction scores and priorities."""
    file_path = os.path.join(DATA_PROCESSED, "support_tickets.parquet")
    df = pd.read_parquet(file_path)
    valid_scores = df["satisfaction_score"].dropna()
    assert (valid_scores < 1).sum() == 0
    assert (valid_scores > 5).sum() == 0


def test_duckdb_parquet_query():
    """Verify DuckDB analytical engine can execute multi-table joins on Parquet."""
    from analytics.duckdb_client import DuckDBClient

    client = DuckDBClient()
    client.register_parquet_views()
    
    # Run test aggregation
    df = client.query("""
        SELECT 
            p.plan_name,
            COUNT(s.subscription_id) AS total_subs,
            ROUND(AVG(s.monthly_price), 2) AS avg_price
        FROM plans p
        JOIN subscriptions s ON p.plan_id = s.plan_id
        GROUP BY p.plan_name
    """)
    assert len(df) >= 3
    client.close()


def test_data_quality_suite_passes():
    """Verify DataQualityValidator reports 100% passed rules."""
    from analytics.data_quality import DataQualityValidator

    validator = DataQualityValidator()
    success = validator.run_all()
    assert success is True, "Data quality validator detected integrity failures"
