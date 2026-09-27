"""Customer360 Synthetic Data Generator.

Generates realistic subscription-business datasets with authentic relationships:
- Tenure influences behavior and stability
- Declining engagement directly precedes churn
- Support friction (high priority, poor satisfaction) correlates with churn
- Contract types impact churn velocity (monthly vs annual)
- Pricing tiers drive usage depth
- Payment delinquency causes involuntary churn
- High-value accounts and channel-specific acquisition behaviors are preserved

All generation is deterministic and reproducible with fixed random seeds.
Outputs:
  - Raw CSV files in data/raw/
  - Analytical Parquet files in data/processed/
  - Sample preview datasets in data/sample/
"""

import os
import random
import datetime
from datetime import date, timedelta
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

# Global reproducibility seed
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED = os.path.join(BASE_DIR, "data", "processed")
DATA_SAMPLE = os.path.join(BASE_DIR, "data", "sample")

os.makedirs(DATA_RAW, exist_ok=True)
os.makedirs(DATA_PROCESSED, exist_ok=True)
os.makedirs(DATA_SAMPLE, exist_ok=True)

# Simulation date range
END_DATE = date(2026, 9, 1)
START_DATE = date(2024, 1, 1)
TOTAL_DAYS = (END_DATE - START_DATE).days

FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Donald", "Mark", "Paul",
    "Steven", "Andrew", "Kenneth", "Joshua", "Kevin", "Brian", "George", "Edward",
    "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas",
    "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin"
]

FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica",
    "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley",
    "Kimberly", "Emily", "Donna", "Michelle", "Dorothy", "Carol", "Amanda", "Melissa",
    "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy",
    "Shirley", "Angela", "Helen", "Anna", "Brenda", "Pamela", "Nicole", "Emma"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

CITIES_BY_COUNTRY: Dict[str, List[Tuple[str, str]]] = {
    "United States": [
        ("San Francisco", "California"), ("New York", "New York"), ("Austin", "Texas"),
        ("Seattle", "Washington"), ("Chicago", "Illinois"), ("Boston", "Massachusetts"),
        ("Denver", "Colorado"), ("Atlanta", "Georgia")
    ],
    "United Kingdom": [
        ("London", "Greater London"), ("Manchester", "North West"),
        ("Edinburgh", "Scotland"), ("Birmingham", "West Midlands")
    ],
    "Canada": [
        ("Toronto", "Ontario"), ("Vancouver", "British Columbia"), ("Montreal", "Quebec")
    ],
    "Germany": [
        ("Berlin", "Berlin"), ("Munich", "Bavaria"), ("Frankfurt", "Hesse")
    ],
    "Australia": [
        ("Sydney", "New South Wales"), ("Melbourne", "Victoria"), ("Brisbane", "Queensland")
    ],
    "France": [
        ("Paris", "Île-de-France"), ("Lyon", "Auvergne-Rhône-Alpes")
    ]
}

COUNTRIES = list(CITIES_BY_COUNTRY.keys())
COUNTRY_WEIGHTS = [0.50, 0.18, 0.10, 0.09, 0.08, 0.05]

ACQUISITION_CHANNELS = [
    "Organic Search", "Paid Ads", "Referral", "Partner", "Social Media", "Direct"
]
CHANNEL_WEIGHTS = [0.30, 0.25, 0.15, 0.10, 0.12, 0.08]


def generate_plans() -> pd.DataFrame:
    """Generate predefined SaaS plans."""
    plans = [
        {
            "plan_id": "plan_starter",
            "plan_name": "Starter",
            "tier": "Starter",
            "monthly_price": 29.00,
            "annual_price": 290.00, # 2 months free discount
            "max_seats": 2,
            "features_included": "Core Analytics, 5 Dashboards, Standard Support",
            "created_at": "2024-01-01 00:00:00"
        },
        {
            "plan_id": "plan_growth",
            "plan_name": "Growth",
            "tier": "Growth",
            "monthly_price": 79.00,
            "annual_price": 790.00,
            "max_seats": 10,
            "features_included": "Advanced Metrics, 25 Dashboards, Priority Support, API Access",
            "created_at": "2024-01-01 00:00:00"
        },
        {
            "plan_id": "plan_pro",
            "plan_name": "Professional",
            "tier": "Professional",
            "monthly_price": 179.00,
            "annual_price": 1790.00,
            "max_seats": 25,
            "features_included": "Predictive Churn Engine, Unlimited Dashboards, 24/7 Support, Webhooks",
            "created_at": "2024-01-01 00:00:00"
        },
        {
            "plan_id": "plan_enterprise",
            "plan_name": "Enterprise",
            "tier": "Enterprise",
            "monthly_price": 499.00,
            "annual_price": 4990.00,
            "max_seats": 100,
            "features_included": "Dedicated AI Analyst, Custom Integrations, SLA, Dedicated Account Exec",
            "created_at": "2024-01-01 00:00:00"
        }
    ]
    return pd.DataFrame(plans)


def generate_dataset(num_customers: int = 1500) -> Dict[str, pd.DataFrame]:
    """Generate complete relational dataset with realistic business distributions."""
    print(f"Generating Customer360 dataset for {num_customers} customers (Seed={RANDOM_SEED})...")

    # 1. Plans
    df_plans = generate_plans()
    plan_map = {row["plan_id"]: row for _, row in df_plans.iterrows()}

    # 2. Customers
    customers_data = []
    used_emails = set()

    for i in range(1, num_customers + 1):
        cust_id = f"CUST-{i:05d}"
        gender = random.choice(["Male", "Female"])
        first_name = random.choice(FIRST_NAMES_MALE if gender == "Male" else FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)
        
        # Age distribution (bimodal around 28 and 42)
        if random.random() < 0.6:
            age = int(np.clip(np.random.normal(31, 6), 21, 68))
        else:
            age = int(np.clip(np.random.normal(46, 8), 24, 75))

        country = random.choices(COUNTRIES, weights=COUNTRY_WEIGHTS)[0]
        city, region = random.choice(CITIES_BY_COUNTRY[country])

        # Acquisition channel
        channel = random.choices(ACQUISITION_CHANNELS, weights=CHANNEL_WEIGHTS)[0]

        # Email generation with uniqueness guarantee
        email_base = f"{first_name.lower()}.{last_name.lower()}"
        email = f"{email_base}@company{i % 450 + 1}.com"
        suffix = 1
        while email in used_emails:
            email = f"{email_base}{suffix}@company{i % 450 + 1}.com"
            suffix += 1
        used_emails.add(email)

        # Signup date distribution (growing month-over-month)
        # Power law / beta distribution towards more recent dates
        day_offset = int(np.random.beta(2.5, 1.5) * (TOTAL_DAYS - 30))
        signup_date = START_DATE + timedelta(days=day_offset)

        customers_data.append({
            "customer_id": cust_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "age": age,
            "gender": gender,
            "country": country,
            "region": region,
            "city": city,
            "signup_date": signup_date,
            "acquisition_channel": channel,
            "customer_status": "active", # Will be updated after subscription/churn modeling
            "created_at": f"{signup_date} 09:00:00"
        })

    df_customers = pd.DataFrame(customers_data)

    # 3. Subscriptions & Churn modeling
    subscriptions_data = []
    churn_data = []
    transactions_data = []
    payments_data = []
    tickets_data = []
    engagement_data = []
    usage_data = []

    sub_counter = 1
    tx_counter = 1
    pay_counter = 1
    ticket_counter = 1
    churn_counter = 1
    eng_counter = 1
    usage_counter = 1

    for idx, cust in df_customers.iterrows():
        cust_id = cust["customer_id"]
        signup = cust["signup_date"]
        channel = cust["acquisition_channel"]
        age = cust["age"]

        # Channel influences initial tier & contract preference
        if channel in ["Partner", "Direct"]:
            plan_weights = [0.15, 0.35, 0.35, 0.15]
            contract_weights = [0.40, 0.50, 0.10] # More annual
        elif channel in ["Paid Ads", "Social Media"]:
            plan_weights = [0.55, 0.30, 0.12, 0.03]
            contract_weights = [0.80, 0.18, 0.02] # Heavily monthly
        else: # Organic Search, Referral
            plan_weights = [0.35, 0.40, 0.20, 0.05]
            contract_weights = [0.55, 0.40, 0.05]

        chosen_plan_id = random.choices(
            ["plan_starter", "plan_growth", "plan_pro", "plan_enterprise"],
            weights=plan_weights
        )[0]
        chosen_contract = random.choices(
            ["monthly", "annual", "multi_year"],
            weights=contract_weights
        )[0]

        plan_info = plan_map[chosen_plan_id]
        monthly_price = float(plan_info["monthly_price"])

        # Determine if and when the customer churns
        # Realistic churn drivers:
        # Base churn hazard per month
        monthly_hazard = 0.045
        if chosen_contract == "annual":
            monthly_hazard *= 0.45
        elif chosen_contract == "multi_year":
            monthly_hazard *= 0.20

        if channel in ["Paid Ads", "Social Media"]:
            monthly_hazard *= 1.35
        elif channel == "Referral":
            monthly_hazard *= 0.65

        if chosen_plan_id == "plan_enterprise":
            monthly_hazard *= 0.40
        elif chosen_plan_id == "plan_starter":
            monthly_hazard *= 1.25

        # Does customer churn before simulation END_DATE?
        days_active_possible = (END_DATE - signup).days
        months_possible = max(1, days_active_possible // 30)

        # Geometric survival simulation
        has_churned = False
        churn_month = 0
        for m in range(1, months_possible + 1):
            if random.random() < monthly_hazard:
                has_churned = True
                churn_month = m
                break

        sub_id = f"SUB-{sub_counter:06d}"
        sub_counter += 1

        if has_churned:
            churn_days = min(days_active_possible, churn_month * 30 + random.randint(1, 28))
            churn_date = signup + timedelta(days=churn_days)
            if churn_date > END_DATE:
                has_churned = False
                end_date = None
                sub_status = "active"
                df_customers.at[idx, "customer_status"] = "active"
            else:
                end_date = churn_date
                sub_status = "cancelled"
                df_customers.at[idx, "customer_status"] = "churned"
        else:
            end_date = None
            sub_status = "active"
            df_customers.at[idx, "customer_status"] = "active"

        subscriptions_data.append({
            "subscription_id": sub_id,
            "customer_id": cust_id,
            "plan_id": chosen_plan_id,
            "contract_type": chosen_contract,
            "start_date": signup,
            "end_date": end_date,
            "monthly_price": monthly_price,
            "status": sub_status,
            "auto_renew": sub_status == "active",
            "cancellation_reason": "Customer initiated cancellation" if has_churned else None,
            "created_at": f"{signup} 09:05:00"
        })

        # 4. Churn Event if churned
        if has_churned and end_date:
            churn_id = f"CHURN-{churn_counter:05d}"
            churn_counter += 1

            # Determine reason
            reasons = [
                "price_sensitivity", "competitor_switch", "lack_of_features",
                "poor_support", "infrequent_use", "payment_delinquency"
            ]
            reason_weights = [0.28, 0.24, 0.18, 0.12, 0.12, 0.06]
            churn_reason = random.choices(reasons, weights=reason_weights)[0]
            churn_type = "involuntary" if churn_reason == "payment_delinquency" else "voluntary"

            feedback_options = {
                "price_sensitivity": "Plan became too expensive relative to our budget this fiscal quarter.",
                "competitor_switch": "Switched to alternative offering bundled pricing with CRM.",
                "lack_of_features": "Missing specific multi-tenant compliance reporting required by our team.",
                "poor_support": "Unresolved support tickets and slow resolution times.",
                "infrequent_use": "Project ended, team no longer requires active daily platform access.",
                "payment_delinquency": "Card declined multiple billing attempts without updated payment details."
            }

            churn_data.append({
                "churn_id": churn_id,
                "customer_id": cust_id,
                "subscription_id": sub_id,
                "churn_date": end_date,
                "churn_reason": churn_reason,
                "churn_type": churn_type,
                "feedback": feedback_options.get(churn_reason, "No comments provided."),
                "created_at": f"{end_date} 18:00:00"
            })

        # 5. Billing Transactions & Payments
        # Recurring cadence: monthly or annual
        billing_interval_days = 365 if chosen_contract in ["annual", "multi_year"] else 30
        current_billing_date = signup
        effective_end = end_date if has_churned and end_date else END_DATE

        payment_method = random.choices(
            ["credit_card", "paypal", "bank_transfer"],
            weights=[0.70, 0.18, 0.12]
        )[0]
        gateway = "stripe" if payment_method == "credit_card" else ("braintree" if payment_method == "paypal" else "adyen")

        charge_amount = float(plan_info["annual_price"]) if billing_interval_days == 365 else monthly_price

        while current_billing_date <= effective_end:
            tx_id = f"TXN-{tx_counter:07d}"
            tx_counter += 1

            # Is this the final payment for an involuntarily churned account?
            is_failing_payment = (
                has_churned and
                end_date and
                abs((end_date - current_billing_date).days) <= 7 and
                random.random() < 0.60
            )

            tx_status = "failed" if is_failing_payment else "succeeded"

            transactions_data.append({
                "transaction_id": tx_id,
                "customer_id": cust_id,
                "subscription_id": sub_id,
                "transaction_date": f"{current_billing_date} 02:15:00",
                "amount": charge_amount,
                "transaction_type": "subscription_charge",
                "payment_method": payment_method,
                "payment_status": tx_status,
                "created_at": f"{current_billing_date} 02:15:00"
            })

            pay_id = f"PAY-{pay_counter:07d}"
            pay_counter += 1
            payments_data.append({
                "payment_id": pay_id,
                "transaction_id": tx_id,
                "customer_id": cust_id,
                "payment_date": f"{current_billing_date} 02:15:05",
                "amount": charge_amount,
                "payment_method": payment_method,
                "payment_gateway": gateway,
                "status": "completed" if tx_status == "succeeded" else "declined",
                "failure_reason": "Insufficient funds / card expired" if tx_status == "failed" else None,
                "created_at": f"{current_billing_date} 02:15:05"
            })

            current_billing_date += timedelta(days=billing_interval_days)

        # 6. Support Tickets
        # Customers with issues or heading towards churn generate more tickets
        base_ticket_chance = 0.65 if has_churned else 0.35
        num_tickets = np.random.poisson(2.5 if has_churned else 1.0)

        for _ in range(num_tickets):
            # Ticket date occurs between signup and effective end
            active_span = max(1, (effective_end - signup).days)
            ticket_offset = random.randint(0, active_span)
            t_created = signup + timedelta(days=ticket_offset)
            t_created_dt = datetime.datetime.combine(t_created, datetime.time(random.randint(8, 20), random.randint(0, 59)))

            # If churned, bias categories towards billing & technical
            if has_churned:
                cat_weights = [0.35, 0.35, 0.10, 0.05, 0.15]
                priority_weights = [0.10, 0.30, 0.40, 0.20] # higher urgency
                sat_weights = [0.35, 0.30, 0.20, 0.10, 0.05] # lower satisfaction (1-5)
            else:
                cat_weights = [0.20, 0.30, 0.20, 0.25, 0.05]
                priority_weights = [0.35, 0.45, 0.15, 0.05]
                sat_weights = [0.05, 0.08, 0.20, 0.40, 0.27]

            category = random.choices(
                ["billing", "technical_issue", "account_access", "feature_request", "cancellation_request"],
                weights=cat_weights
            )[0]
            priority = random.choices(["low", "medium", "high", "urgent"], weights=priority_weights)[0]
            satisfaction = random.choices([1, 2, 3, 4, 5], weights=sat_weights)[0]

            # Resolution time in hours
            res_hours = round(float(np.random.exponential(18.0 if has_churned else 6.0)), 2)
            res_hours = min(res_hours, 168.0) # cap at 1 week
            t_resolved_dt = t_created_dt + timedelta(hours=res_hours)

            t_id = f"TCK-{ticket_counter:06d}"
            ticket_counter += 1

            tickets_data.append({
                "ticket_id": t_id,
                "customer_id": cust_id,
                "created_at": t_created_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "resolved_at": t_resolved_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "category": category,
                "priority": priority,
                "resolution_time": res_hours,
                "satisfaction_score": satisfaction,
                "status": "closed",
            })

        # 7. Engagement & Product Usage (Sampled weekly/bi-weekly cadence per customer)
        # We sample active weeks to maintain clean database performance while capturing trends
        total_weeks = max(1, (effective_end - signup).days // 7)
        for w in range(total_weeks):
            week_start = signup + timedelta(days=w * 7)
            if week_start > effective_end:
                break

            # Calculate engagement decay if approaching churn
            weeks_until_churn = (effective_end - week_start).days // 7 if has_churned else 999
            decay_factor = 1.0
            if has_churned and weeks_until_churn <= 4:
                decay_factor = max(0.15, 0.20 * weeks_until_churn)

            # Base activity level based on plan tier
            tier_multiplier = 1.0
            if chosen_plan_id == "plan_enterprise":
                tier_multiplier = 2.4
            elif chosen_plan_id == "plan_pro":
                tier_multiplier = 1.8
            elif chosen_plan_id == "plan_growth":
                tier_multiplier = 1.3

            sessions = max(0, int(np.random.poisson(8 * tier_multiplier * decay_factor)))
            logins = max(sessions, int(sessions * random.uniform(1.0, 1.4)))
            duration = round(sessions * float(np.random.gamma(4, 5)), 2) # minutes
            features_used = min(15, max(1, int(np.random.poisson(4 * tier_multiplier * decay_factor))))
            active_days = min(7, max(1 if sessions > 0 else 0, int(np.random.poisson(3.5 * decay_factor))))

            eng_id = f"ENG-{eng_counter:07d}"
            eng_counter += 1

            engagement_data.append({
                "engagement_id": eng_id,
                "customer_id": cust_id,
                "date": week_start,
                "sessions": sessions,
                "session_duration": duration,
                "logins": logins,
                "features_used": features_used,
                "active_days": active_days,
                "created_at": f"{week_start} 23:59:59"
            })

            # Feature-level usage
            features = ['dashboard_view', 'report_export', 'api_request', 'team_collaboration', 'automated_workflow', 'ai_query']
            for feat in features:
                if random.random() < (0.65 * decay_factor):
                    usage_id = f"USG-{usage_counter:08d}"
                    usage_counter += 1
                    count = max(1, int(np.random.poisson(12 * tier_multiplier * decay_factor)))
                    dur_secs = count * random.randint(15, 90)

                    usage_data.append({
                        "usage_id": usage_id,
                        "customer_id": cust_id,
                        "date": week_start,
                        "feature_name": feat,
                        "usage_count": count,
                        "duration_seconds": dur_secs,
                        "units": "events",
                        "created_at": f"{week_start} 23:59:59"
                    })

    # Assemble DataFrames
    dfs = {
        "plans": df_plans,
        "customers": df_customers,
        "subscriptions": pd.DataFrame(subscriptions_data),
        "transactions": pd.DataFrame(transactions_data),
        "payments": pd.DataFrame(payments_data),
        "support_tickets": pd.DataFrame(tickets_data),
        "customer_engagement": pd.DataFrame(engagement_data),
        "product_usage": pd.DataFrame(usage_data),
        "churn_events": pd.DataFrame(churn_data),
    }

    print("\nDataset Generation Complete! Table summary:")
    for name, df in dfs.items():
        print(f"  - {name}: {len(df):,} records")

    return dfs


def export_datasets(dfs: Dict[str, pd.DataFrame]) -> None:
    """Save datasets to CSV (raw), Parquet (processed), and Sample folders."""
    print("\nExporting datasets...")

    for name, df in dfs.items():
        # 1. Export CSV to data/raw/
        raw_csv_path = os.path.join(DATA_RAW, f"{name}.csv")
        df.to_csv(raw_csv_path, index=False)

        # 2. Export Parquet to data/processed/
        processed_parquet_path = os.path.join(DATA_PROCESSED, f"{name}.parquet")
        df.to_parquet(processed_parquet_path, engine="pyarrow", index=False)

        # 3. Export Sample (top 20 rows) to data/sample/
        sample_csv_path = os.path.join(DATA_SAMPLE, f"{name}_sample.csv")
        df.head(20).to_csv(sample_csv_path, index=False)

        print(f"  ✓ Saved {name}: {raw_csv_path} & {processed_parquet_path}")

    print("\nAll datasets exported successfully.")


if __name__ == "__main__":
    datasets = generate_dataset(num_customers=1500)
    export_datasets(datasets)
