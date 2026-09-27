"""
Customer360 Data Quality Schemas
================================
Typed models for data hygiene, rule validation, and integrity testing.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class QualityRuleResult(BaseModel):
    rule_name: str = Field(..., description="Validation rule name")
    category: str = Field(..., description="Rule category (Uniqueness, Completeness, Integrity, Consistency)")
    table: str = Field(..., description="Target database table")
    status: str = Field(..., description="Validation outcome: PASSED or FAILED")
    details: str = Field(..., description="Detailed explanation of test results")
    failed_count: int = Field(0, description="Number of violating records")


class DataQualityReport(BaseModel):
    status: str = Field(..., description="Overall dataset health status: PASSED or FAILED")
    total_rules: int = Field(..., description="Total validation checks executed")
    passed_rules: int = Field(..., description="Total passed checks")
    failed_rules: int = Field(0, description="Total failed checks")
    score_pct: float = Field(..., description="Data quality compliance score (0.0 - 100.0%)")
    summary: str = Field(..., description="Executive summary of data foundation health")
    checks: List[QualityRuleResult] = Field(..., description="Detailed breakdown of validation checks")
