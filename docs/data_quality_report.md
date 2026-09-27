# Customer360 - Data Quality Validation Report

**Date Generated**: 2026-09-27 22:50:36 UTC  
**Validation Suite**: Enterprise Relational Data Quality & Observability Gatekeeper  
**Quality Score**: **100.0%** (105/105 rules passed)  
**Active Alerts**: **0**  

---

## 1. Dimension Health Scorecard

| Dimension | Description | Checks Passed | Dimension Score | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Completeness** | Mandatory NOT NULL column assertions | 47/47 | **100.0%** | 🟢 Healthy |
| **Uniqueness** | Primary key uniqueness and idempotent transactions | 10/10 | **100.0%** | 🟢 Healthy |
| **Validity** | Dates, negative values, and domain category constraints | 19/19 | **100.0%** | 🟢 Healthy |
| **Relationship Integrity** | Foreign key referential integrity & state alignment | 9/9 | **100.0%** | 🟢 Healthy |
| **Freshness** | Data timeliness, stream lag, and ingestion SLA | 2/2 | **100.0%** | 🟢 Healthy |
| **Schema & Volume** | Column contracts, schema drift, and record bounds | 18/18 | **100.0%** | 🟢 Healthy |

---

## 2. Table Record Counts

| Entity | Record Count | Storage Format |
| :--- | :--- | :--- |
| `plans` | **4** | Apache Parquet / CSV |
| `customers` | **1,500** | Apache Parquet / CSV |
| `subscriptions` | **1,500** | Apache Parquet / CSV |
| `transactions` | **9,891** | Apache Parquet / CSV |
| `payments` | **9,891** | Apache Parquet / CSV |
| `support_tickets` | **2,360** | Apache Parquet / CSV |
| `customer_engagement` | **63,278** | Apache Parquet / CSV |
| `product_usage` | **242,740** | Apache Parquet / CSV |
| `churn_events` | **526** | Apache Parquet / CSV |

---

## 3. Validation Test Suite Breakdown

| Check Name | Target Table | Dimension | Status | Severity | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Duplicate Primary Key: plans.plan_id** | `plans` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 4 records. |
| **Duplicate Primary Key: customers.customer_id** | `customers` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 1,500 records. |
| **Duplicate Primary Key: subscriptions.subscription_id** | `subscriptions` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 1,500 records. |
| **Duplicate Primary Key: transactions.transaction_id** | `transactions` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 9,891 records. |
| **Duplicate Primary Key: payments.payment_id** | `payments` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 9,891 records. |
| **Duplicate Primary Key: support_tickets.ticket_id** | `support_tickets` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 2,360 records. |
| **Duplicate Primary Key: customer_engagement.engagement_id** | `customer_engagement` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 63,278 records. |
| **Duplicate Primary Key: product_usage.usage_id** | `product_usage` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 242,740 records. |
| **Duplicate Primary Key: churn_events.churn_id** | `churn_events` | Uniqueness | 🟢 PASSED | CRITICAL | Found 0 duplicate keys out of 526 records. |
| **Duplicate Transaction Ledger Check** | `transactions` | Uniqueness | 🟢 PASSED | HIGH | Found 0 duplicate identical payment attempts (same customer, timestamp, amount). |
| **Mandatory Field Not Null: customers.customer_id** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.first_name** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.last_name** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.email** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.signup_date** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.acquisition_channel** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: customers.customer_status** | `customers` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: plans.plan_id** | `plans` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 4 records. |
| **Mandatory Field Not Null: plans.plan_name** | `plans` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 4 records. |
| **Mandatory Field Not Null: plans.tier** | `plans` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 4 records. |
| **Mandatory Field Not Null: plans.monthly_price** | `plans` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 4 records. |
| **Mandatory Field Not Null: plans.annual_price** | `plans` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 4 records. |
| **Mandatory Field Not Null: subscriptions.subscription_id** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: subscriptions.customer_id** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: subscriptions.plan_id** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: subscriptions.contract_type** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: subscriptions.start_date** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: subscriptions.status** | `subscriptions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 1,500 records. |
| **Mandatory Field Not Null: transactions.transaction_id** | `transactions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: transactions.customer_id** | `transactions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: transactions.transaction_date** | `transactions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: transactions.amount** | `transactions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: transactions.payment_status** | `transactions` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: payments.payment_id** | `payments` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: payments.transaction_id** | `payments` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: payments.customer_id** | `payments` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: payments.amount** | `payments` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: payments.status** | `payments` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 9,891 records. |
| **Mandatory Field Not Null: support_tickets.ticket_id** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: support_tickets.customer_id** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: support_tickets.created_at** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: support_tickets.category** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: support_tickets.priority** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: support_tickets.status** | `support_tickets` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 2,360 records. |
| **Mandatory Field Not Null: customer_engagement.engagement_id** | `customer_engagement` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 63,278 records. |
| **Mandatory Field Not Null: customer_engagement.customer_id** | `customer_engagement` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 63,278 records. |
| **Mandatory Field Not Null: customer_engagement.date** | `customer_engagement` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 63,278 records. |
| **Mandatory Field Not Null: customer_engagement.sessions** | `customer_engagement` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 63,278 records. |
| **Mandatory Field Not Null: product_usage.usage_id** | `product_usage` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 242,740 records. |
| **Mandatory Field Not Null: product_usage.customer_id** | `product_usage` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 242,740 records. |
| **Mandatory Field Not Null: product_usage.date** | `product_usage` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 242,740 records. |
| **Mandatory Field Not Null: product_usage.feature_name** | `product_usage` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 242,740 records. |
| **Mandatory Field Not Null: churn_events.churn_id** | `churn_events` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 526 records. |
| **Mandatory Field Not Null: churn_events.customer_id** | `churn_events` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 526 records. |
| **Mandatory Field Not Null: churn_events.subscription_id** | `churn_events` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 526 records. |
| **Mandatory Field Not Null: churn_events.churn_date** | `churn_events` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 526 records. |
| **Mandatory Field Not Null: churn_events.churn_reason** | `churn_events` | Completeness | 🟢 PASSED | HIGH | Found 0 null values out of 526 records. |
| **Subscription End Date >= Start Date** | `subscriptions` | Validity | 🟢 PASSED | HIGH | Found 0 subscriptions with end_date prior to start_date. |
| **Support Ticket Resolution Date >= Creation Date** | `support_tickets` | Validity | 🟢 PASSED | HIGH | Found 0 tickets with resolution timestamp prior to creation. |
| **Customer Signup Date Temporal Sanity** | `customers` | Validity | 🟢 PASSED | HIGH | Found 0 signups dated beyond allowable operational horizon. |
| **Churn Date >= Subscription Start Date** | `churn_events` | Validity | 🟢 PASSED | HIGH | Found 0 churn events occurring prior to subscription activation. |
| **Transaction Amounts Non-Negative** | `transactions` | Validity | 🟢 PASSED | HIGH | Found 0 transactions with negative cash amounts. |
| **Payment Invoices Non-Negative** | `payments` | Validity | 🟢 PASSED | HIGH | Found 0 payments with negative cash amounts. |
| **Product Plan Pricing Non-Negative** | `plans` | Validity | 🟢 PASSED | HIGH | Found 0 product tiers with negative subscription pricing. |
| **Engagement Sessions & Duration Non-Negative** | `customer_engagement` | Validity | 🟢 PASSED | HIGH | Found 0 engagement records with negative sessions or duration. |
| **Support Resolution Hours Non-Negative** | `support_tickets` | Validity | 🟢 PASSED | HIGH | Found 0 support tickets with negative resolution duration. |
| **Customer Demographics Age Range [18-100]** | `customers` | Validity | 🟢 PASSED | MEDIUM | Found 0 accounts with age outside valid adult bounds [18, 100]. |
| **Categorical Domain Integrity: customers.customer_status** | `customers` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['active', 'churned']. |
| **Categorical Domain Integrity: customers.gender** | `customers` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['Male', 'Female', 'Non-Binary', 'Other']. |
| **Categorical Domain Integrity: customers.acquisition_channel** | `customers` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['Referral', 'Paid Ads', 'Organic Search', 'Partner', 'Social Media', 'Direct']. |
| **Categorical Domain Integrity: subscriptions.contract_type** | `subscriptions` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['monthly', 'annual', 'multi_year']. |
| **Categorical Domain Integrity: subscriptions.status** | `subscriptions` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['active', 'cancelled', 'expired']. |
| **Categorical Domain Integrity: transactions.payment_status** | `transactions` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['succeeded', 'failed', 'completed', 'refunded']. |
| **Categorical Domain Integrity: transactions.payment_method** | `transactions` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['credit_card', 'paypal', 'bank_transfer', 'apple_pay']. |
| **Categorical Domain Integrity: support_tickets.priority** | `support_tickets` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['low', 'medium', 'high', 'urgent']. |
| **Categorical Domain Integrity: plans.tier** | `plans` | Validity | 🟢 PASSED | MEDIUM | Found 0 unexpected categories. Allowed: ['Starter', 'Growth', 'Professional', 'Enterprise']. |
| **Foreign Key Integrity: subscriptions.customer_id -> customers.customer_id** | `subscriptions` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan subscription records. |
| **Foreign Key Integrity: subscriptions.plan_id -> plans.plan_id** | `subscriptions` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan subscription plan mappings. |
| **Foreign Key Integrity: transactions.customer_id -> customers.customer_id** | `transactions` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan transaction records. |
| **Foreign Key Integrity: transactions.subscription_id -> subscriptions.subscription_id** | `transactions` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan transactions pointing to nonexistent subscriptions. |
| **Foreign Key Integrity: payments.transaction_id -> transactions.transaction_id** | `payments` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan payments. |
| **Foreign Key Integrity: support_tickets.customer_id -> customers.customer_id** | `support_tickets` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan support tickets. |
| **Foreign Key Integrity: churn_events.subscription_id -> subscriptions.subscription_id** | `churn_events` | Relationship Integrity | 🟢 PASSED | CRITICAL | Found 0 orphan churn events. |
| **Customer State Consistency: Churned Accounts Not Active** | `customers` | Relationship Integrity | 🟢 PASSED | HIGH | Found 0 accounts marked active despite recorded churn events. |
| **Subscription State Consistency: Churned Subscriptions Cancelled** | `subscriptions` | Relationship Integrity | 🟢 PASSED | HIGH | Found 0 subscriptions marked active despite recorded churn events. |
| **Schema Stability & Column Contract: plans** | `plans` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 6 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: customers** | `customers` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 10 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: subscriptions** | `subscriptions` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 7 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: transactions** | `transactions` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 7 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: payments** | `payments` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 6 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: support_tickets** | `support_tickets` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 6 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: customer_engagement** | `customer_engagement` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 5 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: product_usage** | `product_usage` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 5 expected contract columns verified. Missing: None. |
| **Schema Stability & Column Contract: churn_events** | `churn_events` | Schema Stability & Volume | 🟢 PASSED | HIGH | All 5 expected contract columns verified. Missing: None. |
| **Record Volume Threshold: customers** | `customers` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 1,500 rows (Min expected threshold: 1,000). |
| **Record Volume Threshold: subscriptions** | `subscriptions` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 1,500 rows (Min expected threshold: 1,000). |
| **Record Volume Threshold: transactions** | `transactions` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 9,891 rows (Min expected threshold: 5,000). |
| **Record Volume Threshold: payments** | `payments` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 9,891 rows (Min expected threshold: 5,000). |
| **Record Volume Threshold: support_tickets** | `support_tickets` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 2,360 rows (Min expected threshold: 1,000). |
| **Record Volume Threshold: customer_engagement** | `customer_engagement` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 63,278 rows (Min expected threshold: 10,000). |
| **Record Volume Threshold: product_usage** | `product_usage` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 242,740 rows (Min expected threshold: 10,000). |
| **Record Volume Threshold: churn_events** | `churn_events` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 526 rows (Min expected threshold: 200). |
| **Record Volume Threshold: plans** | `plans` | Schema Stability & Volume | 🟢 PASSED | MEDIUM | Current record count: 4 rows (Min expected threshold: 4). |
| **Transaction Stream Ingestion Freshness** | `transactions` | Freshness | 🟢 PASSED | MEDIUM | Latest transaction timestamp: 2026-09-01 02:15:00. Max record timestamp: 2026-09-01 19:39:00. |
| **Customer Engagement Telemetry Freshness** | `customer_engagement` | Freshness | 🟢 PASSED | MEDIUM | Latest user telemetry date: 2026-08-25 00:00:00. |

---

## 4. Observability & Alerting Status

* **Total Checks Evaluated**: 105
* **Passed Checks**: 105 (100.0%)
* **Failed Checks**: 0
* **Warnings**: 0
* **Active Production Alerts**: 0
