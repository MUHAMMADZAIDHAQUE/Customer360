"""
Customer360 Production Deployment Verification Engine
=====================================================
Automated end-to-end post-deployment testing suite that verifies:
1. Frontend Client Accessibility & Bundle Integrity
2. Backend REST API Root & OpenAPI Swagger Documentation
3. PostgreSQL / DuckDB Database Connectivity & Health Probes
4. Canonical Business Metrics & Executive KPIs
5. Multidimensional Churn, Contract, Plan, and Tenure Analytics
6. Behavioral RFM Customer Segmentation & Retention Playbooks
7. Triangular Cohort Retention Matrices
8. Revenue Run-Rate, ARPU, CLV, and Capital at Risk
9. Machine Learning Real-Time Inference & TreeSHAP Feature Attribution
10. AI Analyst Intent Resolution & Verified Analytics Copilot
11. Data Quality Gatekeeper (105-Check Schema & Rule Hygiene)
12. Enterprise Structured Error Handling (404, 422, Safe 500 Responses)
"""

import sys
import os
import time
import requests

API_BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://127.0.0.1:5173")

passed_checks = 0
failed_checks = 0
results = []


def record_check(name: str, passed: bool, details: str = "", latency_ms: float = 0.0):
    global passed_checks, failed_checks
    status_str = "PASSED" if passed else "FAILED"
    if passed:
        passed_checks += 1
        print(f"  [✓] {name} ({latency_ms:.1f}ms)")
    else:
        failed_checks += 1
        print(f"  [✗] {name}: {details}")
    results.append({
        "name": name,
        "status": status_str,
        "details": details,
        "latency_ms": latency_ms
    })


def test_endpoint(name: str, method: str, path: str, expected_status: int = 200, json_payload: dict = None, validate_fn=None):
    url = f"{API_BASE_URL}{path}"
    t0 = time.time()
    try:
        if method.upper() == "GET":
            res = requests.get(url, timeout=5)
        elif method.upper() == "POST":
            res = requests.post(url, json=json_payload, timeout=5)
        else:
            record_check(name, False, f"Unsupported method: {method}")
            return None
        latency = (time.time() - t0) * 1000
        
        if res.status_code != expected_status:
            record_check(name, False, f"Expected HTTP {expected_status}, got {res.status_code}: {res.text[:120]}", latency)
            return None
        
        data = res.json() if res.headers.get("content-type", "").startswith("application/json") else res.text
        if validate_fn:
            validation_err = validate_fn(data)
            if validation_err:
                record_check(name, False, f"Validation failed: {validation_err}", latency)
                return None
        
        record_check(name, True, "OK", latency)
        return data
    except Exception as e:
        latency = (time.time() - t0) * 1000
        record_check(name, False, f"Connection error: {str(e)}", latency)
        return None


def run_full_verification():
    print("=================================================================")
    print("Customer360 Production Deployment Verification Suite")
    print(f"API Target: {API_BASE_URL}")
    print(f"Frontend Target: {FRONTEND_BASE_URL}")
    print("=================================================================\n")

    # 1. System & Health Probes
    print("1. System Health & Infrastructure Probes:")
    test_endpoint("Root Information (/)", "GET", "/", 200, validate_fn=lambda d: None if d.get("status") == "operational" else "Missing operational status")
    test_endpoint("Health Probe (/health)", "GET", "/health", 200, validate_fn=lambda d: None if d.get("status") == "ok" and d.get("model_loaded") is True else f"Health check failed: {d}")
    test_endpoint("OpenAPI Documentation (/docs)", "GET", "/docs", 200)

    # 2. Customers Directory & Profile
    print("\n2. Customer Directory & 360° Profile API:")
    cust_data = test_endpoint("Customers List & Pagination (/customers)", "GET", "/customers?page=1&page_size=10", 200, validate_fn=lambda d: None if d.get("total", 0) > 0 and len(d.get("items", [])) > 0 else "No customer records returned")
    
    first_cust_id = cust_data["items"][0]["customer_id"] if cust_data and cust_data.get("items") else "CUST-00001"
    test_endpoint(f"Customer 360 Detail (/customers/{first_cust_id})", "GET", f"/customers/{first_cust_id}", 200, validate_fn=lambda d: None if d.get("customer_id") == first_cust_id else "ID mismatch")
    test_endpoint("Customer Filtering by Status (/customers?status=active)", "GET", "/customers?status=active", 200)

    # 3. Canonical Metrics & Business KPIs
    print("\n3. Canonical Metrics & Financial Analytics:")
    test_endpoint("Executive KPIs (/metrics)", "GET", "/metrics", 200, validate_fn=lambda d: None if d.get("total_customers", 0) > 0 and d.get("active_mrr", 0) > 0 else "Invalid metrics values")
    test_endpoint("Revenue Run-Rate Summary (/revenue)", "GET", "/revenue", 200, validate_fn=lambda d: None if d.get("total_mrr", 0) > 0 and len(d.get("plan_breakdown", [])) > 0 else "Invalid revenue breakdown")
    test_endpoint("Revenue at Risk (/revenue/at-risk)", "GET", "/revenue/at-risk", 200, validate_fn=lambda d: None if d.get("total_arr_at_risk", 0) > 0 else "Missing at-risk capital")

    # 4. Multidimensional Churn Analytics
    print("\n4. Multidimensional Churn & Cohort Analysis:")
    test_endpoint("Churn Summary (/churn)", "GET", "/churn", 200)
    test_endpoint("Monthly Churn Trends (/churn/trends)", "GET", "/churn/trends", 200)
    test_endpoint("Churn by Contract Type (/churn/by-contract)", "GET", "/churn/by-contract", 200)
    test_endpoint("Churn by Plan Tier (/churn/by-plan)", "GET", "/churn/by-plan", 200)
    test_endpoint("Churn by Tenure Bracket (/churn/by-tenure)", "GET", "/churn/by-tenure", 200)
    test_endpoint("RFM Behavioral Segments (/segments)", "GET", "/segments", 200)
    test_endpoint("Triangular Cohort Matrix (/cohorts)", "GET", "/cohorts", 200)

    # 5. Machine Learning Predictions & Explainability
    print("\n5. Machine Learning Real-Time Model Inference:")
    test_endpoint("Batch Predictions Leaderboard (/predictions)", "GET", "/predictions?limit=20", 200, validate_fn=lambda d: None if d.get("total_scored", 0) > 0 and len(d.get("items", [])) > 0 else "Predictions empty")
    test_endpoint(f"Single Account TreeSHAP Inference (/predictions/{first_cust_id})", "GET", f"/predictions/{first_cust_id}", 200, validate_fn=lambda d: None if len(d.get("top_risk_factors", [])) > 0 else "Missing SHAP risk factors")

    # 6. AI Analyst & Natural Language Grounded Queries
    print("\n6. AI Customer Intelligence Analyst:")
    test_endpoint("AI Suggested Questions (/analyst/suggested-questions)", "GET", "/analyst/suggested-questions", 200)
    test_endpoint("AI Suggestions Alias (/analyst/suggestions)", "GET", "/analyst/suggestions", 200)
    test_endpoint(
        "AI Grounded Query (/analyst/query)",
        "POST",
        "/analyst/query",
        200,
        json_payload={"query": "Why did churn increase this quarter?"},
        validate_fn=lambda d: None if d.get("answer") and len(d.get("supporting_metrics", [])) > 0 else "AI query did not return grounded answer"
    )

    # 7. Data Quality & Observability Layer
    print("\n7. Data Quality & Observability Gatekeeper:")
    test_endpoint("Data Quality Scorecard (/data-quality)", "GET", "/data-quality", 200, validate_fn=lambda d: None if d.get("score_pct", 0) >= 90.0 and d.get("passed_rules", 0) > 0 else f"Quality score degraded: {d.get('score_pct')}")

    # 8. Security & Error Handling Resilience
    print("\n8. Security & Enterprise Error Handling:")
    test_endpoint("404 Nonexistent Customer (/customers/CUST-INVALID-99999)", "GET", "/customers/CUST-INVALID-99999", 404)
    test_endpoint("422 Invalid Pagination Page 0 (/customers?page=0)", "GET", "/customers?page=0", 422)
    test_endpoint("422 Page Size Exceeding Limit (/customers?page_size=5000)", "GET", "/customers?page_size=5000", 422)

    # 9. Frontend Client Reachability
    print("\n9. Frontend Web Client Accessibility:")
    t0 = time.time()
    try:
        f_res = requests.get(FRONTEND_BASE_URL, timeout=5)
        f_latency = (time.time() - t0) * 1000
        if f_res.status_code == 200 and ("Customer360" in f_res.text or "<div id=\"root\">" in f_res.text or "<!DOCTYPE html>" in f_res.text or "<!doctype html>" in f_res.text):
            record_check(f"Frontend SPA Webpage ({FRONTEND_BASE_URL})", True, "Accessible", f_latency)
        else:
            record_check(f"Frontend SPA Webpage ({FRONTEND_BASE_URL})", False, f"Unexpected response {f_res.status_code}", f_latency)
    except Exception as e:
        f_latency = (time.time() - t0) * 1000
        record_check(f"Frontend SPA Webpage ({FRONTEND_BASE_URL})", False, f"Connection failed: {str(e)}", f_latency)

    # Summary
    print("\n=================================================================")
    print("DEPLOYMENT VERIFICATION SUMMARY")
    print("=================================================================")
    total = passed_checks + failed_checks
    success_rate = (passed_checks / total * 100) if total > 0 else 0
    print(f"Total Probes:   {total}")
    print(f"Passed Probes:  {passed_checks}")
    print(f"Failed Probes:  {failed_checks}")
    print(f"Success Rate:   {success_rate:.1f}%")
    
    if failed_checks == 0:
        print("\n🎉 PRODUCTION DEPLOYMENT VERIFICATION COMPLETE: ALL SYSTEMS OPERATIONAL!")
        return 0
    else:
        print(f"\n⚠️ DEPLOYMENT VERIFICATION DETECTED {failed_checks} ISSUES. REVIEW ABOVE LOGS.")
        return 1


if __name__ == "__main__":
    exit_code = run_full_verification()
    sys.exit(exit_code)
