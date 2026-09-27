"""
Customer360 - Investigation Layer Master Runner
================================================
Orchestrates:
1. Deep Dive Investigation across 10 business areas
2. Cohort Retention Matrix & Heatmaps
3. RFM Behavioral Segmentation (Polars quintiles)
4. Historical vs Projected CLV Modeling
5. Formal Statistical Hypothesis Testing
6. Automated Synthesis of Fact-Based Executive Report Data

Outputs all verified numbers to console and JSON cache.
"""

import os
import json
import duckdb
import pandas as pd
from cohort_analysis import CohortAnalysis
from rfm_analysis import RFMAnalysis
from clv_analysis import CLVAnalysis
from statistical_tests import StatisticalInvestigator
from deep_dive_analysis import DeepDiveInvestigator

CACHE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reports/investigation_summary.json"))


def run_full_investigation():
    print("=" * 60)
    print("CUSTOMER360 - PHASE 3 DATA ANALYST INVESTIGATION")
    print("=" * 60)

    # 1. Deep Dive
    print("\n[1/5] Running Multidimensional Deep Dive Investigation...")
    deep_dive = DeepDiveInvestigator()
    deep_dive_res = deep_dive.run_all()
    print("✓ Deep Dive complete. Analyzed demographics, revenue, churn, support, engagement, usage.")

    # 2. Cohort Analysis
    print("\n[2/5] Running Signup-Month Cohort Retention Investigation...")
    cohort = CohortAnalysis()
    cohort_res = cohort.run()
    print(f"✓ Cohort analysis complete across {cohort_res['cohort_count']} cohorts.")
    print("  Key Retention Milestones (Weighted Averages):")
    for k, v in cohort_res["milestones"].items():
        print(f"    {k}: {v['weighted_retention_pct']}% (from {v['cohorts_matured']} cohorts)")

    # 3. RFM Analysis
    print("\n[3/5] Running RFM Quantitative Behavioral Segmentation (Polars)...")
    rfm = RFMAnalysis()
    rfm_res = rfm.run()
    print("✓ RFM Segmentation complete for 1,500 accounts.")
    print("  RFM Segments Summary:")
    for row in rfm_res["summary"]:
        print(f"    {row['authoritative_rfm_segment']:<22} | Count: {row['customer_count']:<4} | Churn: {row['churn_rate_pct']:>5.1f}% | ARR: ${row['total_active_arr']:>10,.2f}")

    # 4. CLV Analysis
    print("\n[4/5] Running Historical vs Projected CLV Modeling...")
    clv = CLVAnalysis()
    clv_res = clv.run()
    ov = clv_res["summary"]["overall"]
    print("✓ CLV Analysis complete.")
    print(f"  Total Realized Historical CLV: ${ov['total_observed_clv']:,.2f}")
    print(f"  Mean Historical CLV:           ${ov['mean_observed_clv']:,.2f}")
    print(f"  Total Projected Lifetime Value: ${ov['total_projected_lifetime_value']:,.2f}")
    print(f"  Mean Projected Lifetime Value:  ${ov['mean_projected_clv']:,.2f}")

    # 5. Statistical Hypothesis Testing
    print("\n[5/5] Executing Formal Statistical Hypothesis Tests...")
    stats_runner = StatisticalInvestigator()
    tests_res = stats_runner.run_all_tests()
    print(f"✓ Executed {len(tests_res)} statistical hypothesis tests.")
    for t in tests_res:
        sig = "REJECT H0 (Significant)" if t["result"]["is_statistically_significant"] else "FAIL TO REJECT H0"
        print(f"  * {t['test_name'][:50]:<50} -> {sig}")

    # Consolidate and cache
    full_summary = {
        "deep_dive": deep_dive_res,
        "cohort": cohort_res,
        "rfm": rfm_res,
        "clv": clv_res,
        "statistical_tests": tests_res
    }

    # Ensure JSON serializable
    with open(CACHE_PATH, "w") as f:
        json.dump(full_summary, f, indent=2, default=str)
    print(f"\n✓ Master analytical cache successfully written to:\n  {CACHE_PATH}")
    print("=" * 60)
    print("PHASE 3 INVESTIGATION LAYER SUCCESSFULLY EXECUTED")
    print("=" * 60)
    return full_summary


if __name__ == "__main__":
    run_full_investigation()
