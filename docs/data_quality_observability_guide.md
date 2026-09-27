# Customer360 - Data Quality & Observability Architecture Guide

**Version**: 1.0.0  
**Phase**: Phase 9 (Data Quality & Observability Layer)  
**System**: Customer360 Enterprise Analytics & ML Platform  

---

## 1. Overview & Architecture

The **Data Quality & Observability Layer** serves as the automated gatekeeper of Customer360. It enforces rigorous schema, relational, financial, and operational integrity across the entire subscription data warehouse. It guards against data corruption, silent data drift, pipeline lag, and broken relationships before data reaches downstream analytics marts, machine learning models, and executive dashboards.

```
                  ┌──────────────────────────────────────────────┐
                  │          Raw Ingestion Streams & CSVs        │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Automated Data Quality Gatekeeper         │
                  │   (105 Documented Integrity & Observability) │
                  │                                              │
                  │  • Completeness (47 checks)                  │
                  │  • Uniqueness (10 checks)                    │
                  │  • Validity & Domain Rules (19 checks)       │
                  │  • Relationship Integrity (9 checks)         │
                  │  • Freshness & Timeliness (2 checks)         │
                  │  • Schema Stability & Volume (18 checks)     │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
        [ All 105 Checks Passed ]       [ Violation Detected ]
                 │                               │
                 ▼                               ▼
      ┌─────────────────────┐        ┌─────────────────────────┐
      │ dbt Marts Refresh & │        │ Alert Manager Engine    │
      │ ML Inference Engine │        │ • Severity Mapping      │
      └─────────────────────┘        │ • Runbook Remediation   │
                                     │ • Slack/PagerDuty/DataDog│
                                     │ • Quarantine Routing    │
                                     └─────────────────────────┘
```

---

## 2. Nine Core Monitoring Domains

The platform monitors **9 core data quality and observability areas** spanning all 9 relational entities (`plans`, `customers`, `subscriptions`, `transactions`, `payments`, `support_tickets`, `customer_engagement`, `product_usage`, and `churn_events`):

| # | Monitoring Area | Quality Dimension | Core Objective & Enforcement |
| :- | :--- | :--- | :--- |
| **1** | **Null Values** | `Completeness` | Asserts that mandatory operational fields (e.g. `customer_id`, `email`, `amount`, `created_at`) contain 0 null values across all tables (47 checks). |
| **2** | **Duplicates** | `Uniqueness` | Enforces primary key uniqueness across all 9 entities, plus identical transaction ledger idempotency checks (10 checks). |
| **3** | **Invalid Relationships** | `Relationship Integrity` | Validates referential integrity (foreign keys) across all relations (e.g., `subscriptions` → `customers`, `transactions` → `subscriptions`, `payments` → `transactions`) with zero orphan records (9 checks). |
| **4** | **Invalid Dates** | `Validity` | Enforces chronological causality (e.g., `subscription.end_date >= start_date`, `ticket.resolved_at >= created_at`, `churn_date >= subscription.start_date`) (4 checks). |
| **5** | **Negative Values** | `Validity` | Protects financial and volumetric metrics against invalid negative values (`amount >= 0`, `sessions >= 0`, `usage_count >= 0`, `age > 0`) (8 checks). |
| **6** | **Unexpected Categories** | `Validity` | Enforces strict domain enum whitelists for categorical fields (e.g., `contract_type`, `payment_status`, `ticket.priority`, `acquisition_channel`) (7 checks). |
| **7** | **Schema Changes** | `Schema Stability` | Verifies full column presence and schema contracts for all 9 entities, alerting on upstream schema drift or missing attributes (9 checks). |
| **8** | **Record Counts** | `Schema & Volume` | Asserts volumetric lower bounds to ensure ingestion pipelines are not dropping partitions or suffering ingestion truncation (9 checks). |
| **9** | **Freshness** | `Freshness` | Monitors ingestion timestamps against operational freshness SLAs across high-throughput transaction and telemetry streams (2 checks). |

---

## 3. Transparent Quality Score Formulation

Customer360 **does NOT use arbitrary or synthetic quality scores**. Every score presented in the UI and APIs is calculated directly from mathematically verifiable check results:

### Dimension Quality Score Formula
For any quality dimension $D$:
$$\text{Score}_D = \left( \frac{\sum_{i=1}^{N_D} \mathbb{I}(\text{check}_i = \text{PASSED})}{N_D} \right) \times 100\%$$

Where:
* $N_D$ = Total checks evaluated under dimension $D$.
* $\mathbb{I}(\text{check}_i = \text{PASSED})$ = Indicator function returning $1$ if check passed, $0$ otherwise.

### Overall Composite Quality Score Formula
$$\text{Overall Score} = \left( \frac{\sum_{j=1}^{M} \mathbb{I}(\text{check}_j = \text{PASSED})}{M} \right) \times 100\%$$

Where $M = 105$ is the total documented check suite across all entities.

### Benchmark Results (Current Certified Baseline)
* **Overall Score**: **100.0%** (105 / 105 checks passed)
* **Completeness**: **100.0%** (47 / 47 checks passed)
* **Uniqueness**: **100.0%** (10 / 10 checks passed)
* **Validity**: **100.0%** (19 / 19 checks passed)
* **Relationship Integrity**: **100.0%** (9 / 9 checks passed)
* **Freshness**: **100.0%** (2 / 2 checks passed)
* **Schema Stability & Volume**: **100.0%** (18 / 18 checks passed)

---

## 4. Quality Rules & Thresholds Catalog

### 4.1. Completeness Rules (47 Checks)
* **Threshold**: **0 nulls permitted** for all mandatory columns.
* **Tables Audited**: `customers` (7 fields), `plans` (5 fields), `subscriptions` (6 fields), `transactions` (5 fields), `payments` (5 fields), `support_tickets` (6 fields), `customer_engagement` (4 fields), `product_usage` (4 fields), `churn_events` (5 fields).

### 4.2. Uniqueness Rules (10 Checks)
* **Primary Key Uniqueness**: `plans.plan_id`, `customers.customer_id`, `subscriptions.subscription_id`, `transactions.transaction_id`, `payments.payment_id`, `support_tickets.ticket_id`, `customer_engagement.engagement_id`, `product_usage.usage_id`, `churn_events.churn_id`.
* **Ledger Idempotency**: Zero duplicate transactions sharing identical `(customer_id, transaction_date, amount)`.
* **Threshold**: **0 duplicates allowed** (100% unique primary keys).

### 4.3. Referential Integrity Rules (9 Checks)
* `subscriptions.customer_id` $\rightarrow$ `customers.customer_id` (0 orphans)
* `subscriptions.plan_id` $\rightarrow$ `plans.plan_id` (0 orphans)
* `transactions.customer_id` $\rightarrow$ `customers.customer_id` (0 orphans)
* `transactions.subscription_id` $\rightarrow$ `subscriptions.subscription_id` (0 orphans)
* `payments.transaction_id` $\rightarrow$ `transactions.transaction_id` (0 orphans)
* `support_tickets.customer_id` $\rightarrow$ `customers.customer_id` (0 orphans)
* `customer_engagement.customer_id` $\rightarrow$ `customers.customer_id` (0 orphans)
* `product_usage.customer_id` $\rightarrow$ `customers.customer_id` (0 orphans)
* `churn_events.subscription_id` $\rightarrow$ `subscriptions.subscription_id` (0 orphans)
* **Threshold**: **0 orphan records permitted**.

### 4.4. Validity & Domain Rules (19 Checks)
* **Temporal Causal Rules**:
  * `subscriptions.end_date >= subscriptions.start_date`
  * `support_tickets.resolved_at >= support_tickets.created_at`
  * `customers.signup_date <= operational_horizon`
  * `churn_events.churn_date >= subscriptions.start_date`
* **Non-Negative Value Rules**:
  * `plans.monthly_price >= 0` & `annual_price >= 0`
  * `customers.age >= 18`
  * `subscriptions.monthly_price >= 0`
  * `transactions.amount >= 0`
  * `payments.amount >= 0`
  * `customer_engagement.sessions >= 0` & `session_duration >= 0`
  * `product_usage.usage_count >= 0`
* **Categorical Domain Constraints**:
  * `customers.customer_status` $\in$ `['active', 'churned']`
  * `customers.gender` $\in$ `['Male', 'Female', 'Non-Binary', 'Other']`
  * `customers.acquisition_channel` $\in$ `['Referral', 'Paid Ads', 'Organic Search', 'Partner', 'Social Media', 'Direct']`
  * `subscriptions.contract_type` $\in$ `['monthly', 'annual', 'multi_year']`
  * `subscriptions.status` $\in$ `['active', 'cancelled', 'expired']`
  * `transactions.payment_status` $\in$ `['succeeded', 'failed', 'completed', 'refunded']`
  * `support_tickets.priority` $\in$ `['low', 'medium', 'high', 'urgent']`

### 4.5. Schema & Volumetric Bounds (18 Checks)
* **Schema Contract Stability**: 9 checks verifying all expected column definitions across all tables.
* **Volumetric Thresholds**:
  * `customers`: $\ge 1,000$ records (Actual: 1,500)
  * `subscriptions`: $\ge 1,000$ records (Actual: 1,500)
  * `transactions`: $\ge 5,000$ records (Actual: 9,891)
  * `payments`: $\ge 5,000$ records (Actual: 9,891)
  * `support_tickets`: $\ge 1,000$ records (Actual: 2,360)
  * `customer_engagement`: $\ge 10,000$ records (Actual: 63,278)
  * `product_usage`: $\ge 10,000$ records (Actual: 242,740)
  * `churn_events`: $\ge 200$ records (Actual: 526)
  * `plans`: $\ge 4$ records (Actual: 4)

### 4.6. Freshness SLAs (2 Checks)
* `transactions` stream: Ingestion lag within active operational window.
* `customer_engagement` stream: Telemetry date within active operational window.

---

## 5. Failure Behavior & Incident Alerting

### 5.1. Operational Severities
When a check fails or reports an anomaly, the Alert Engine categorizes the failure into an operational severity tier:

| Severity | Definition | Examples | Pipeline Action |
| :--- | :--- | :--- | :--- |
| **`CRITICAL`** | Direct risk of data corruption, primary key collision, or relational mismatch. | Foreign key orphan, duplicate PK, schema contract column drop. | **Halt ETL & dbt Mart builds immediately**. Block ML batch inference. Page on-call engineer. |
| **`HIGH`** | Financial distortion or chronological inconsistency. | Negative transaction amount, invalid chronological date sequence. | **Route violating rows to quarantine table**. Allow clean records to proceed. Send high-priority alert. |
| **`MEDIUM`** | Volumetric anomaly, freshness SLA breach, or high null rate in non-critical attributes. | Telemetry ingestion delay, volumetric drop below threshold. | Log warning, trigger background backfill retry, notify team Slack channel. |
| **`LOW`** | Minor cosmetic anomaly or unexpected enum value. | Unmapped acquisition channel tag. | Log anomaly, tag with default categorization for analyst review. |

### 5.2. Pipeline Quarantine Strategy
To prevent whole-pipeline gridlocks on non-critical violations, Customer360 implements a **Quarantine Table Pattern**:
1. Staging views filter violating rows into `staging.quarantine_<entity>`.
2. Clean records pass through to `intermediate` and `marts`.
3. An incident alert is dispatched containing the quarantine batch ID and row count.
4. Data engineers review and replay repaired records using the prescribed runbook action.

---

## 6. Production Alerting Integrations

The Alert Manager is designed to integrate seamlessly with modern enterprise notification stacks:

```
                  ┌──────────────────────────────────────────────┐
                  │          Alert Manager Incident Engine       │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────┐                ┌───────────────┐                ┌───────────────┐
│ Slack Webhook │                │   PagerDuty   │                │    Datadog    │
│  Integration  │                │  On-Call API  │                │   APM & Logs  │
└───────┬───────┘                └───────┬───────┘                └───────┬───────┘
        │                                │                                │
        ▼                                ▼                                ▼
#data-quality-alerts             Trigger Incident                  Custom Metric:
Channel notification             (CRITICAL severity)               `dq.checks.failed`
with Runbook buttons             Escalate to On-Call               `dq.score.overall`
```

### 6.1. Slack Webhook Integration
* **Environment Variable**: `SLACK_WEBHOOK_URL`
* **Format**: Interactive Slack BlockKit payload containing check name, failed count, affected table, and clickable remediation runbook links.

### 6.2. PagerDuty Incident Dispatch
* **Environment Variable**: `PAGERDUTY_ROUTING_KEY`
* **Trigger Policy**: Triggered automatically on `CRITICAL` breaches (e.g. Broken Foreign Keys, Primary Key collisions).

### 6.3. Datadog Observability Metrics
* Real-time metrics emitted:
  * `customer360.data_quality.overall_score`: Gauge (0-100)
  * `customer360.data_quality.checks.passed`: Counter
  * `customer360.data_quality.checks.failed`: Counter
  * `customer360.data_quality.freshness_lag_hours`: Gauge

---

## 7. Automated Monitoring Strategy

1. **Pre-Ingestion**: Ingestion schema validation prevents corrupted raw CSV/JSON files from entering PostgreSQL.
2. **dbt Transformation Gate**: Before analytical marts materialization, dbt schema tests (`unique`, `not_null`, `relationships`) validate intermediate models.
3. **Continuous Validator Execution**: The `DataQualityValidator` runs on-demand via REST API (`POST /data-quality/run`) and via automated cron schedules.
4. **Interactive Dashboard**: Accessible through the frontend at the **Data Quality** page (`/quality`), showing real-time dimension status, pass/fail counts, and active alert notifications.

---

## 8. Prescribed Runbook Actions

Every alert automatically surfaces an engineering runbook:
* **Foreign Key Violation**: *"Pause downstream dbt mart refreshes. Inspect upstream ingestion CDC pipeline for {table}. Execute quarantine script on orphan foreign keys."*
* **Primary Key Collision**: *"Halt ETL pipeline immediately. Inspect deduplication merge logic on {table}. Deduplicate records keeping latest CDC watermark timestamp."*
* **Negative Financial Values**: *"Review payment gateway webhook payloads. Quarantine negative transactions in staging.{table} before mart materialization."*
* **Schema Drift**: *"Schema drift detected on {table}. Review upstream database migrations. Update dbt source contracts and coordinate with data engineering."*
* **Freshness Breach**: *"Data freshness SLA breach on {table}. Check Airflow/Dagster ingestion task logs and verify database replica replication lag."*
