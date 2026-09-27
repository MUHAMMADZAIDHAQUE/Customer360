# Customer360 - AI Customer Intelligence Analyst Architecture
=============================================================

> **Zero-Hallucination Conversational Intelligence Layer Grounded in Curated Analytical Marts and Machine Learning Explainability**

---

## 1. Objective & Executive Overview

The **Customer360 AI Analyst** provides executive leadership, Customer Success Managers (CSMs), and revenue operations with an intuitive natural-language interface to query complex subscription intelligence.

### Critical Requirement: Zero Hallucinations & No Arbitrary SQL
A major flaw of generic conversational AI in analytics is metric fabrication (inventing churn rates or extrapolating numbers) and security vulnerabilities (prompt injection leading to arbitrary SQL execution or database credential leakage).

Customer360 enforces a **deterministic tool-dispatch architecture**:
* **No Unrestricted Arbitrary SQL**: Users cannot submit raw SQL queries, and the LLM/intent layer cannot execute arbitrary DDL/DML.
* **Strict Tool Schema**: Natural language inquiries are classified into **vetted, parameterized analytical tools** that run predetermined, validated aggregation queries against DuckDB curated marts (`mart_customer_360`, `mart_customer_segments`, `mart_cohort_retention`, `mart_monthly_kpis`) and machine learning artifacts (`customer_churn_predictions.parquet`, `global_feature_importance.json`).
* **Metric Provenance**: Every response cites exact verified numbers, underlying data sources, filters applied, timestamps, and statistical limitations.
* **Model Interpretation Transparency**: Responses explicitly distinguish between **Ground-Truth Historical Accounting Facts** and **Machine Learning Predictive Scoring**.

---

## 2. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER NATURAL LANGUAGE QUERY                     │
│               "Why did churn increase this quarter?"                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     1. INTENT DETECTION & ROUTING                      │
│     Pattern matching, entity extraction, and classification engine     │
│   Mapped: CHURN_DRIVERS | Filters: Contract Types (Monthly vs Annual)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   2. APPROVED ANALYTICAL TOOL REGISTRY                 │
│      Strict parameterized queries (Zero arbitrary SQL execution)       │
│                  `_tool_churn_drivers(query)`                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               3. DATABASE & ANALYTICAL MARTS EXECUTION                 │
│         DuckDB execution on `main_marts.mart_customer_360`             │
│            and `ml/artifacts/customer_churn_predictions`               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   4. VALIDATED RESULT VERIFICATION                     │
│     Non-negative bounds, rate sanity checks (0-100%), metric ties      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                5. GROUNDED EXPLANATION & METRIC SYNTHESIS              │
│       • Narrative Answer with bold strategic callouts                  │
│       • Supporting Metrics with benchmarks (e.g. 43.9% vs 20.7%)       │
│       • Interactive Chart / Table specification (Recharts payload)     │
│       • Provenance Flag: `is_model_interpretation = False`             │
│       • Lineage: `main_marts.mart_customer_360`, `churn_events`        │
│       • Statistical Caveats & Limitations note                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     6. POLISHED CLIENT UI RENDERING                    │
│    Chat stream, KPI metric cards, dynamic chart, table, follow-ups     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Approved Analytical Tools & Canonical Inquiries

The AI Analyst supports a comprehensive library of approved analytical tools answering core executive and operational questions:

### 1. Churn Drivers Tool (`CHURN_DRIVERS`)
* **Canonical Prompt**: *"Why did churn increase this quarter?"* or *"Why is churn high?"*
* **Underlying Marts**: `main_marts.mart_customer_360`, `churn_events`, `plans`
* **Verified Analytical Findings**:
  * Month-to-month contracts experience a **43.9% churn rate**—over **2.1x higher** than annual commitments (20.7%) and **2.4x higher** than multi-year commitments (18.3%).
  * Monthly subscribers account for **77.9% of all historical churn events** (410 of 526 cancellations).
  * Average tenure at churn for monthly accounts is **9.2 months**, with a steep hazard cliff between Month 1 and Month 3.
  * Support friction accounts (resolution time >24h or CSAT ≤ 2.0) experience significantly elevated attrition.
* **Visual Payload**: Clustered column chart comparing churn rates across contract types.
* **Provenance**: `is_model_interpretation = false` (Historical Accounting Fact).

### 2. Customer Segment Churn Tool (`SEGMENT_CHURN`)
* **Canonical Prompt**: *"Which customer segment has the highest churn?"*
* **Underlying Marts**: `main_marts.mart_customer_segments`, `main_marts.mart_customer_360`
* **Verified Analytical Findings**:
  * **"Promising / New Customers"** exhibits the highest churn rate at **100.0%**, followed by **"Potential Loyalists"** at **87.0%**. These early cohorts represent trial users who failed to habituate.
  * Conversely, **"Loyal Customers"** exhibits the lowest churn rate at only **1.9%**, anchoring **$476,076 in active ARR**.
  * Each segment maps to an authoritative **Retention Playbook** (e.g. VIP onboarding, automated re-engagement, CSM health reviews).
* **Visual Payload**: Horizontal bar chart of churn rate by segment and comprehensive 9-row RFM matrix table.
* **Provenance**: `is_model_interpretation = false`.

### 3. Revenue at Risk Tool (`REVENUE_AT_RISK`)
* **Canonical Prompt**: *"How much revenue is currently at risk?"*
* **Underlying Marts**: `main_marts.mart_customer_360`, `main_marts.mart_customer_revenue`
* **Verified Analytical Findings**:
  * Exactly **$207,756 in Annual Recurring Revenue (ARR)**—or **$17,313/month in MRR**—is currently at imminent risk of churn.
  * Affects **167 active subscriber accounts**, representing **15.3% of the active portfolio ARR** ($1,359,072 across 974 accounts).
  * Exposure is concentrated in Enterprise and Growth tiers, triggered primarily by severe engagement decay (>50% drop in active days), support ticket friction, and payment delinquency.
* **Visual Payload**: Donut chart of revenue at risk distribution across product plan tiers.
* **Provenance**: `is_model_interpretation = false`.

### 4. Plan Retention Tool (`PLAN_RETENTION`)
* **Canonical Prompt**: *"Which plans have the highest retention?"*
* **Underlying Marts**: `plans`, `main_marts.mart_customer_360`
* **Verified Analytical Findings**:
  * The **"Enterprise" plan** has the highest retention rate at **87.6%** (78 of 89 accounts retained) with an ARPU of **$437.33/month**.
  * The retention hierarchy: Enterprise (87.6%), Professional (67.9%), Growth (65.7%), Starter (59.1%).
  * Higher-tier subscriptions benefit from team license embedding, dedicated CSM alignment, and higher contractual switching costs.
* **Visual Payload**: Column chart of retention rate % across Starter, Growth, Professional, and Enterprise tiers.
* **Provenance**: `is_model_interpretation = false`.

### 5. High-Value At-Risk Watchlist Tool (`HIGH_VALUE_AT_RISK`)
* **Canonical Prompt**: *"Show me high-value customers at risk."*
* **Underlying Marts & Artifacts**: `main_marts.mart_customer_360`, `ml/artifacts/customer_churn_predictions.parquet`
* **Verified Analytical Findings**:
  * Ranks active accounts by contracted ARR with `is_at_risk = TRUE` or `churn_probability >= 0.50`.
  * The top 8 vulnerable Enterprise accounts represent **$47,904 in combined ARR at risk**.
  * Accounts include Cynthia Martin (`CUST-00216`, $5,988 ARR, Enterprise, monthly contract), Donald Smith (`CUST-00516`), and Larry Williams (`CUST-01006`).
  * Each record is enriched with ML churn probability, risk tier (Critical/High), primary SHAP risk factor, and prescribed CSM retention playbook.
* **Visual Payload**: Horizontal bar chart of ARR exposure by account and detailed 8-row action roster table.
* **Provenance**: `is_model_interpretation = true` (Machine Learning Scoring & SHAP Attribution).

### 6. Cohort Retention Tool (`COHORT_RETENTION`)
* **Canonical Prompt**: *"How are cohorts retaining over 12 months?"*
* **Underlying Marts**: `main_marts.mart_cohort_retention`
* **Verified Analytical Findings**:
  * Benchmark survival milestones: Month 1 (100.0%), Month 2 (97.8%), Month 3 (93.4%), Month 6 (82.4%), Month 12 (61.2%).
* **Visual Payload**: Line chart of the customer retention survival curve over lifecycle months.
* **Provenance**: `is_model_interpretation = false`.

### 7. ML Explainability Tool (`ML_EXPLAINABILITY`)
* **Canonical Prompt**: *"What are the top SHAP features driving model predictions?"*
* **Underlying Artifacts**: `ml/artifacts/global_feature_importance.json`, `ml/artifacts/model_metrics.json`
* **Verified Analytical Findings**:
  * Champion model: **XGBoost Classifier (ROC-AUC: 0.999)**.
  * Top SHAP features: `monthly_price` (+0.224), `has_support_friction` (+0.058), `avg_resolution_hours` (+0.048), `urgent_ticket_ratio` (+0.033), `recency_days` (+0.028).
* **Visual Payload**: Bar chart of mean absolute SHAP feature importances.
* **Provenance**: `is_model_interpretation = true`.

---

## 4. REST API Endpoints Specification

### 1. `POST /analyst/query`
* **Request Payload**:
  ```json
  {
    "query": "Why did churn increase this quarter?",
    "session_id": "optional-session-id"
  }
  ```
* **Response Payload**:
  ```json
  {
    "query": "Why did churn increase this quarter?",
    "intent": "CHURN_DRIVERS",
    "answer": "Customer churn is overwhelmingly concentrated among month-to-month subscribers...",
    "supporting_metrics": [
      {
        "name": "Portfolio Churn Rate",
        "value": "35.1%",
        "raw_value": 35.1,
        "benchmark": "Total Portfolio Benchmark"
      },
      {
        "name": "Month-to-Month Churn Rate",
        "value": "43.9%",
        "raw_value": 43.9,
        "benchmark": "vs 20.7% Annual"
      }
    ],
    "relevant_segment_or_filter": "Contract Commitment Types (Monthly vs Annual vs Multi-Year)",
    "data_timestamp": "2026-09-28T00:17:15.123456+00:00",
    "chart": {
      "chart_type": "column",
      "title": "Churn Rate % and Cancellation Volume by Contract Commitment",
      "x_label": "Contract Commitment",
      "y_label": "Churn Rate (%)",
      "data": [
        {"label": "Monthly", "value": 43.9, "secondary_value": 410.0},
        {"label": "Annual", "value": 20.7, "secondary_value": 105.0},
        {"label": "Multi-Year", "value": 18.3, "secondary_value": 11.0}
      ]
    },
    "table": null,
    "limitations": "Observational retrospective analysis of 1,500 subscriber accounts. Correlation does not strictly establish causality.",
    "sources": ["main_marts.mart_customer_360", "churn_events", "plans"],
    "is_model_interpretation": false,
    "suggested_followups": [
      "Which customer segment has the highest churn?",
      "How much revenue is currently at risk?",
      "Show me high-value customers at risk."
    ]
  }
  ```

### 2. `GET /analyst/suggested-questions`
* Returns curated list of 5 high-impact questions categorized by topic.

### 3. `GET /analyst/status`
* Returns runtime operational status, connected marts, and security declarations.

---

## 5. UI / UX Design & Safety Principles

1. **Aesthetics**: Polished dark-theme SaaS styling matching the Customer360 design tokens (`#080C14` canvas, `#0E1526` cards, `#1E2D4D` borders).
2. **Clear Provenance Badges**:
   * Violet badge for `🤖 Machine Learning Model Interpretation (XGBoost SHAP Attribution)`.
   * Emerald badge for `📊 Verified Financial Mart (Ground Truth)`.
3. **Structured Metrics Cards**: Displays formatted numbers, units, and contextual benchmarks.
4. **Embedded Visualizations**: Recharts-powered interactive Bar, Column, Line, and Donut charts directly inside the message bubble.
5. **Interactive Tables**: Scrollable data tables for account rosters.
6. **Safety & Security**:
   * Database credentials and system environment variables are never exposed.
   * Prompts containing SQL injection patterns (`DROP TABLE`, `UNION SELECT`) are neutralized and routed safely.
   * Claims unsupported by the dataset are flagged with explicit limitation notes.
