"""
Customer360 Data Quality Router
===============================
Provides data quality scorecard, integrity checks, and validation rule results.
"""

from fastapi import APIRouter
from api.schemas.quality import DataQualityReport, QualityRuleResult
from analytics.data_quality import DataQualityValidator

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])


@router.get(
    "",
    response_model=DataQualityReport,
    summary="Data Quality Health Report",
    description="Returns aggregate dataset quality compliance rate and individual rule verification outcomes."
)
async def get_data_quality():
    validator = DataQualityValidator()
    validator.load_data()
    validator.validate_duplicate_ids()
    validator.validate_null_required_fields()
    validator.validate_dates()
    validator.validate_foreign_keys()
    validator.validate_amounts()
    validator.validate_customer_states()
    validator.validate_duplicate_transactions()

    total_rules = len(validator.results)
    passed_rules = sum(1 for r in validator.results if r["status"] == "PASSED")
    failed_rules = total_rules - passed_rules
    score = 100.0 if total_rules == 0 else round((passed_rules / total_rules) * 100.0, 1)

    checks = [
        QualityRuleResult(
            rule_name=r["check"],
            category=r.get("category", "Integrity"),
            table=r.get("table", "Multiple"),
            status=r["status"],
            details=r["details"],
            failed_count=r.get("failed_count", 0)
        )
        for r in validator.results
    ]

    return DataQualityReport(
        status="PASSED" if failed_rules == 0 else "FAILED",
        total_rules=total_rules,
        passed_rules=passed_rules,
        failed_rules=failed_rules,
        score_pct=score,
        summary=f"Data foundation validated across {total_rules} rules with a {score}% compliance score.",
        checks=checks
    )
