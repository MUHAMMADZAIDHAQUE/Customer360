"""
Customer360 Database Connection & Data Access Layer
===================================================
Provides SQLAlchemy PostgreSQL session factory and DuckDB analytical query engine.
Supports automatic graceful fallback if PostgreSQL service is offline in local dev.
"""

import os
import duckdb
import pandas as pd
from typing import Generator, Optional, Any, List, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError

from api.config import get_settings

settings = get_settings()

# SQLAlchemy Setup (PostgreSQL)
pg_url = settings.DATABASE_URL
if pg_url.startswith("postgresql://"):
    pg_url = pg_url.replace("postgresql://", "postgresql+psycopg2://", 1)

try:
    engine = create_engine(
        pg_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"connect_timeout": 3}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception:
    engine = None
    SessionLocal = None


def get_db() -> Generator[Optional[Session], None, None]:
    """Dependency that yields a SQLAlchemy session if PostgreSQL is online."""
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AnalyticalDataService:
    """High-performance analytical repository querying DuckDB and Parquet stores."""

    def __init__(self, db_path: str = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = db_path or os.path.join(base_dir, "data", "processed", "customer360.duckdb")

    def get_connection(self):
        return duckdb.connect(self.db_path, read_only=True)

    def query_df(self, sql: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
        """Executes parameterized query safely and returns DataFrame."""
        con = self.get_connection()
        try:
            if params:
                df = con.execute(sql, params).df()
            else:
                df = con.execute(sql).df()
            return df
        finally:
            con.close()

    def query_dicts(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        """Executes query and returns list of python dictionaries."""
        df = self.query_df(sql, params)
        return df.to_dict(orient="records")

    def query_one(self, sql: str, params: Optional[List[Any]] = None) -> Optional[Dict[str, Any]]:
        """Executes query and returns first record as dictionary or None."""
        records = self.query_dicts(sql, params)
        return records[0] if records else None


# Global singleton
analytics_service = AnalyticalDataService()
