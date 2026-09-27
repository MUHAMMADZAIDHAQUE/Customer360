import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPORT_PATH = os.path.join(BASE_DIR, "powerbi", "Customer360.Report", "report.json")

report = {
    "config": json.dumps({
        "version": "5.46",
        "themeCollection": {
            "baseTheme": {
                "name": "Customer360 Dark Theme",
                "version": "1.0",
                "type": 2
            }
        },
        "activeSectionIndex": 0,
        "defaultDrillFilterOtherVisuals": True
    }),
    "layoutOptimization": 0,
    "resourcePackages": [],
    "sections": [
        # =====================================================================
        # PAGE 1: Executive Overview
        # =====================================================================
        {
            "name": "Section_ExecutiveOverview",
            "displayName": "Executive Overview",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "High-level health, growth momentum, and recurring revenue trajectory of the customer portfolio"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Exec",
                        "title": "CUSTOMER360 | Executive Portfolio Overview",
                        "subtitle": "Business Question: What is the overall financial and operational health of our subscription portfolio?",
                        "visualType": "textbox"
                    })
                },
                # KPI Card 1: Total Customers
                {
                    "x": 20, "y": 120, "width": 290, "height": 140, "z": 1,
                    "config": json.dumps({
                        "name": "Card_TotalCustomers",
                        "title": "Total Accounts",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Total Customers"},
                        "targetQuestion": "What is the cumulative size of our account base?"
                    })
                },
                # KPI Card 2: Active Customers
                {
                    "x": 330, "y": 120, "width": 290, "height": 140, "z": 2,
                    "config": json.dumps({
                        "name": "Card_ActiveCustomers",
                        "title": "Active Subscribers",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Active Customers"},
                        "targetQuestion": "How many paying subscribers are currently active?"
                    })
                },
                # KPI Card 3: Churn Rate
                {
                    "x": 640, "y": 120, "width": 290, "height": 140, "z": 3,
                    "config": json.dumps({
                        "name": "Card_ChurnRate",
                        "title": "Churn Rate / Retention",
                        "visualType": "card",
                        "query": {"Measures": ["DimCustomer.Churn Rate", "DimCustomer.Retention Rate"]},
                        "targetQuestion": "What is our historical attrition and account retention rate?"
                    })
                },
                # KPI Card 4: ARR & MRR
                {
                    "x": 950, "y": 120, "width": 310, "height": 140, "z": 4,
                    "config": json.dumps({
                        "name": "Card_ARR",
                        "title": "Annual Recurring Revenue (ARR)",
                        "visualType": "card",
                        "query": {"Measures": ["DimCustomer.ARR", "DimCustomer.MRR"]},
                        "targetQuestion": "What is our current contracted annualized run-rate?"
                    })
                },
                # KPI Card 5: ARPU
                {
                    "x": 1280, "y": 120, "width": 290, "height": 140, "z": 5,
                    "config": json.dumps({
                        "name": "Card_ARPU",
                        "title": "ARPU & CLV",
                        "visualType": "card",
                        "query": {"Measures": ["DimCustomer.ARPU", "DimCustomer.CLV"]},
                        "targetQuestion": "How much average revenue is contributed per active user?"
                    })
                },
                # KPI Card 6: Revenue at Risk
                {
                    "x": 1590, "y": 120, "width": 310, "height": 140, "z": 6,
                    "config": json.dumps({
                        "name": "Card_RevAtRisk",
                        "title": "Revenue at Risk",
                        "visualType": "card",
                        "query": {"Measures": ["DimCustomer.Revenue at Risk", "DimCustomer.Revenue at Risk %"]},
                        "targetQuestion": "How much recurring revenue is exposed to imminent churn?"
                    })
                },
                # Visual 1: Active Subscribers & Net MoM Growth Trend
                {
                    "x": 20, "y": 280, "width": 1100, "height": 380, "z": 7,
                    "config": json.dumps({
                        "name": "Chart_GrowthTrend",
                        "title": "Active Subscribers & MoM Net Growth Velocity",
                        "subtitle": "Business Question: Is subscriber growth accelerating or decelerating over time?",
                        "visualType": "lineClusteredColumnComboChart",
                        "x": "DimDate.year_month",
                        "y_column": "DimCustomer.Active Customers",
                        "y_line": "DimCustomer.Customer Growth"
                    })
                },
                # Visual 2: ARR Concentration by Product Plan Tier
                {
                    "x": 1140, "y": 280, "width": 760, "height": 380, "z": 8,
                    "config": json.dumps({
                        "name": "Chart_ARRByPlan",
                        "title": "ARR Distribution by Product Plan Tier",
                        "subtitle": "Business Question: How concentrated is our revenue across Starter, Growth, Pro, and Enterprise tiers?",
                        "visualType": "donutChart",
                        "legend": "DimPlan.plan_name",
                        "values": "DimCustomer.ARR"
                    })
                },
                # Visual 3: Churn Rate and Lost ARR by Contract Type
                {
                    "x": 20, "y": 680, "width": 930, "height": 370, "z": 9,
                    "config": json.dumps({
                        "name": "Chart_ContractChurn",
                        "title": "Churn Rate & Lost ARR by Contract Commitment",
                        "subtitle": "Business Question: Do annual and multi-year commitments structurally protect against attrition?",
                        "visualType": "barChart",
                        "category": "DimContract.contract_type",
                        "series": ["DimCustomer.Churn Rate", "FactChurn.arr_lost"]
                    })
                },
                # Visual 4: Customer Segmentation Share & Revenue Footprint
                {
                    "x": 970, "y": 680, "width": 930, "height": 370, "z": 10,
                    "config": json.dumps({
                        "name": "Chart_SegmentShare",
                        "title": "Account & Revenue Distribution Across Behavioral RFM Segments",
                        "subtitle": "Business Question: What proportion of our customers belong to Champions vs At-Risk cohorts?",
                        "visualType": "columnChart",
                        "category": "DimCustomer.rfm_segment",
                        "values": ["DimCustomer.Active Customers", "DimCustomer.ARR"]
                    })
                }
            ]
        },

        # =====================================================================
        # PAGE 2: Churn Analysis
        # =====================================================================
        {
            "name": "Section_ChurnAnalysis",
            "displayName": "Churn Analysis",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "In-depth attrition patterns, root-cause driver decomposition, and lifecycle drop-offs"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Churn",
                        "title": "CUSTOMER360 | Churn & Attrition Deep Dive",
                        "subtitle": "Business Question: Where, why, and at what lifecycle stage are customers cancelling subscriptions?",
                        "visualType": "textbox"
                    })
                },
                # KPI Summary Bar
                {
                    "x": 20, "y": 120, "width": 450, "height": 130, "z": 1,
                    "config": json.dumps({
                        "name": "Card_ChurnTotals",
                        "title": "Total Churned Accounts",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Churned Customers"},
                        "targetQuestion": "How many customer cancellations have occurred historically?"
                    })
                },
                {
                    "x": 490, "y": 120, "width": 450, "height": 130, "z": 2,
                    "config": json.dumps({
                        "name": "Card_ChurnRateMetric",
                        "title": "Overall Churn Rate",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Churn Rate"},
                        "targetQuestion": "What is the portfolio churn percentage?"
                    })
                },
                {
                    "x": 960, "y": 120, "width": 450, "height": 130, "z": 3,
                    "config": json.dumps({
                        "name": "Card_AvgTenureAtChurn",
                        "title": "Average Customer Tenure",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Average Tenure"},
                        "targetQuestion": "How long do customers stay before churning?"
                    })
                },
                {
                    "x": 1430, "y": 120, "width": 470, "height": 130, "z": 4,
                    "config": json.dumps({
                        "name": "Card_TotalLostARR",
                        "title": "Annualized Recurring Revenue Lost",
                        "visualType": "card",
                        "query": {"Expression": "SUM(FactChurn.arr_lost)"},
                        "targetQuestion": "What is the total ARR destroyed by customer cancellations?"
                    })
                },
                # Visual 1: Churn Hazard by Account Tenure Lifecycle
                {
                    "x": 20, "y": 270, "width": 930, "height": 380, "z": 5,
                    "config": json.dumps({
                        "name": "Chart_TenureHazard",
                        "title": "Churn Hazard by Customer Tenure Bracket",
                        "subtitle": "Business Question: During which tenure stage (0-3 mo, 4-6 mo, 7-12 mo, 13-24 mo) is attrition probability highest?",
                        "visualType": "columnChart",
                        "category": "DimCustomer.tenure_bracket",
                        "values": ["DimCustomer.Churned Customers", "DimCustomer.Churn Rate"]
                    })
                },
                # Visual 2: Stated Cancellation Reasons & ARR Destruction
                {
                    "x": 970, "y": 270, "width": 930, "height": 380, "z": 6,
                    "config": json.dumps({
                        "name": "Chart_ChurnReasons",
                        "title": "Primary Cancellation Reasons & Lost ARR Impact",
                        "subtitle": "Business Question: What primary customer feedback drivers (pricing, missing features, competitor switch, support friction) cause attrition?",
                        "visualType": "barChart",
                        "category": "FactChurn.churn_reason",
                        "values": ["FactChurn.arr_lost", "COUNTROWS(FactChurn)"]
                    })
                },
                # Visual 3: Support Friction & Resolution Latency vs Churn
                {
                    "x": 20, "y": 670, "width": 930, "height": 380, "z": 7,
                    "config": json.dumps({
                        "name": "Chart_SupportCSATImpact",
                        "title": "Support Ticket Resolution Time & CSAT Score by Churn Status",
                        "subtitle": "Business Question: How severely does slow ticket resolution (>24h) and poor CSAT (<3.0) inflate churn probability?",
                        "visualType": "scatterChart",
                        "x": "FactSupport.resolution_time_hours",
                        "y": "FactSupport.satisfaction_score",
                        "legend": "DimCustomer.customer_status"
                    })
                },
                # Visual 4: Churn Rate by Plan Tier vs Acquisition Channel Matrix
                {
                    "x": 970, "y": 670, "width": 930, "height": 380, "z": 8,
                    "config": json.dumps({
                        "name": "Chart_ChannelPlanMatrix",
                        "title": "Churn Vulnerability Matrix: Channel vs Plan Tier",
                        "subtitle": "Business Question: Which acquisition channels deliver customers with high initial churn on entry tiers?",
                        "visualType": "matrix",
                        "rows": "DimAcquisitionChannel.channel_name",
                        "columns": "DimPlan.plan_name",
                        "values": "DimCustomer.Churn Rate"
                    })
                }
            ]
        },

        # =====================================================================
        # PAGE 3: Customer Segmentation
        # =====================================================================
        {
            "name": "Section_CustomerSegmentation",
            "displayName": "Customer Segmentation",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "Behavioral RFM segmentation, customer value clusters, and prescriptive retention action playbooks"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Segments",
                        "title": "CUSTOMER360 | Behavioral RFM Customer Segmentation",
                        "subtitle": "Business Question: How are customer accounts distributed across behavioral RFM tiers and what playbooks protect them?",
                        "visualType": "textbox"
                    })
                },
                # Segment KPI Cards
                {
                    "x": 20, "y": 120, "width": 450, "height": 130, "z": 1,
                    "config": json.dumps({
                        "name": "Card_ChampionsKPI",
                        "title": "Champions & Loyal Customers",
                        "visualType": "card",
                        "query": {"Filter": "rfm_segment IN ('Champions', 'Loyal Customers')", "Measure": "DimCustomer.ARR"},
                        "targetQuestion": "How much contracted revenue is anchored by our most committed advocates?"
                    })
                },
                {
                    "x": 490, "y": 120, "width": 450, "height": 130, "z": 2,
                    "config": json.dumps({
                        "name": "Card_AtRiskSegments",
                        "title": "At-Risk & Can't Lose Them Accounts",
                        "visualType": "card",
                        "query": {"Filter": "rfm_segment IN ('At Risk', 'Cant Lose Them')", "Measure": "DimCustomer.Active Customers"},
                        "targetQuestion": "How many high-value accounts have entered behavioral decay?"
                    })
                },
                {
                    "x": 960, "y": 120, "width": 450, "height": 130, "z": 3,
                    "config": json.dumps({
                        "name": "Card_HibernatingKPI",
                        "title": "Hibernating / About to Sleep",
                        "visualType": "card",
                        "query": {"Filter": "rfm_segment IN ('Hibernating', 'About to Sleep')", "Measure": "DimCustomer.Active Customers"},
                        "targetQuestion": "How many dormant accounts risk slipping into silent churn?"
                    })
                },
                {
                    "x": 1430, "y": 120, "width": 470, "height": 130, "z": 4,
                    "config": json.dumps({
                        "name": "Card_SegmentCLV",
                        "title": "Average Realized Customer Lifetime Value",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.CLV"},
                        "targetQuestion": "What is the realized CLV benchmark across segments?"
                    })
                },
                # Visual 1: Recency vs Monetary Scatter with Frequency Bubble Size
                {
                    "x": 20, "y": 270, "width": 1100, "height": 420, "z": 5,
                    "config": json.dumps({
                        "name": "Scatter_RFMClusters",
                        "title": "Behavioral RFM Space: Recency Days vs Monetary Spend (Bubble = Frequency)",
                        "subtitle": "Business Question: How cleanly do customer accounts separate across recency, session frequency, and cash spend?",
                        "visualType": "scatterChart",
                        "x": "DimCustomer.recency_days",
                        "y": "DimCustomer.monetary_spend",
                        "size": "DimCustomer.frequency_sessions",
                        "legend": "DimCustomer.rfm_segment"
                    })
                },
                # Visual 2: Segment Breakdown by Subscription Plan Tier
                {
                    "x": 1140, "y": 270, "width": 760, "height": 420, "z": 6,
                    "config": json.dumps({
                        "name": "Chart_SegmentByPlan",
                        "title": "RFM Segment Composition by Subscription Plan Tier",
                        "subtitle": "Business Question: Which subscription tiers dominate our high-value Champions and At-Risk accounts?",
                        "visualType": "stackedBarChart",
                        "category": "DimCustomer.rfm_segment",
                        "series": "DimPlan.plan_name",
                        "values": "DimCustomer.Active Customers"
                    })
                },
                # Visual 3: Actionable Retention Playbook Operations Matrix
                {
                    "x": 20, "y": 710, "width": 1880, "height": 340, "z": 7,
                    "config": json.dumps({
                        "name": "Table_RetentionPlaybooks",
                        "title": "Prescriptive Retention Playbook Execution Matrix",
                        "subtitle": "Business Question: What specific operational interventions (VIP perks, CSM outreach, re-engagement campaigns) are mapped to each segment?",
                        "visualType": "tableEx",
                        "columns": [
                            "DimCustomer.rfm_segment",
                            "DimCustomer.retention_playbook",
                            "DimCustomer.Active Customers",
                            "DimCustomer.ARR",
                            "DimCustomer.Revenue at Risk",
                            "DimCustomer.Average Churn Probability",
                            "DimCustomer.Average Tenure"
                        ]
                    })
                }
            ]
        },

        # =====================================================================
        # PAGE 4: Cohort Retention
        # =====================================================================
        {
            "name": "Section_CohortRetention",
            "displayName": "Cohort Retention",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "Acquisition signup cohorts, monthly retention survival rates, and long-term customer longevity"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Cohorts",
                        "title": "CUSTOMER360 | Signup Cohort Retention & Longevity",
                        "subtitle": "Business Question: How well do monthly acquisition cohorts retain over time, and where do steep drop-offs occur?",
                        "visualType": "textbox"
                    })
                },
                # Cohort Milestone Benchmark KPI Cards
                {
                    "x": 20, "y": 120, "width": 450, "height": 130, "z": 1,
                    "config": json.dumps({
                        "name": "Card_M1Retention",
                        "title": "Month 1 Retention Benchmark",
                        "visualType": "card",
                        "targetQuestion": "What percentage of accounts survive past their initial trial/onboarding month?"
                    })
                },
                {
                    "x": 490, "y": 120, "width": 450, "height": 130, "z": 2,
                    "config": json.dumps({
                        "name": "Card_M3Retention",
                        "title": "Month 3 Retention Benchmark",
                        "visualType": "card",
                        "targetQuestion": "What is our 90-day habituation rate?"
                    })
                },
                {
                    "x": 960, "y": 120, "width": 450, "height": 130, "z": 3,
                    "config": json.dumps({
                        "name": "Card_M6Retention",
                        "title": "Month 6 Retention Benchmark",
                        "visualType": "card",
                        "targetQuestion": "What percentage of accounts remain active at half a year?"
                    })
                },
                {
                    "x": 1430, "y": 120, "width": 470, "height": 130, "z": 4,
                    "config": json.dumps({
                        "name": "Card_M12Retention",
                        "title": "Month 12 Retention Benchmark",
                        "visualType": "card",
                        "targetQuestion": "What is our full 1-year annual survival rate?"
                    })
                },
                # Visual 1: Triangular Cohort Retention Matrix Heatmap
                {
                    "x": 20, "y": 270, "width": 1200, "height": 450, "z": 5,
                    "config": json.dumps({
                        "name": "Matrix_CohortRetention",
                        "title": "Acquisition Cohort Retention Heatmap (Month 0 to Month 24)",
                        "subtitle": "Business Question: Are newer signup cohorts retaining better or worse than historical cohorts at identical lifecycle milestones?",
                        "visualType": "matrix",
                        "rows": "DimCustomer.signup_date",
                        "columns": "DimDate.month",
                        "values": "DimCustomer.Retention Rate"
                    })
                },
                # Visual 2: Contract Type Survival Curves
                {
                    "x": 1240, "y": 270, "width": 660, "height": 450, "z": 6,
                    "config": json.dumps({
                        "name": "Line_ContractSurvivalCurves",
                        "title": "Retention Survival Decay Curve by Contract Type",
                        "subtitle": "Business Question: How do annual and multi-year upfront contracts flatten the retention decay curve?",
                        "visualType": "lineChart",
                        "x": "DimCustomer.tenure_bracket",
                        "series": "DimContract.contract_type",
                        "y": "DimCustomer.Retention Rate"
                    })
                },
                # Visual 3: Cohort Realized Lifetime Revenue Cumulative Build
                {
                    "x": 20, "y": 740, "width": 1880, "height": 310, "z": 7,
                    "config": json.dumps({
                        "name": "Area_CumulativeCohortRevenue",
                        "title": "Cumulative Billed Revenue Build Across Signup Cohorts",
                        "subtitle": "Business Question: Which historical acquisition cohorts have generated the highest cumulative cash collections?",
                        "visualType": "areaChart",
                        "x": "DimDate.year_month",
                        "series": "DimPlan.plan_name",
                        "y": "FactTransactions.amount"
                    })
                }
            ]
        },

        # =====================================================================
        # PAGE 5: Revenue Analytics
        # =====================================================================
        {
            "name": "Section_RevenueAnalytics",
            "displayName": "Revenue Analytics",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "Contracted MRR/ARR velocity, billing ledger integrity, payment failures, and revenue at risk"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Revenue",
                        "title": "CUSTOMER360 | Financial Revenue & Billing Analytics",
                        "subtitle": "Business Question: What is our recurring revenue run-rate, billing collection health, and revenue concentration risk?",
                        "visualType": "textbox"
                    })
                },
                # Top Financial KPIs
                {
                    "x": 20, "y": 120, "width": 290, "height": 130, "z": 1,
                    "config": json.dumps({
                        "name": "Card_MRRMetric",
                        "title": "Current MRR",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.MRR"},
                        "targetQuestion": "What is our current monthly recurring revenue run-rate?"
                    })
                },
                {
                    "x": 330, "y": 120, "width": 290, "height": 130, "z": 2,
                    "config": json.dumps({
                        "name": "Card_ARRMetric",
                        "title": "Current ARR",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.ARR"},
                        "targetQuestion": "What is our annualized contracted revenue run-rate?"
                    })
                },
                {
                    "x": 640, "y": 120, "width": 290, "height": 130, "z": 3,
                    "config": json.dumps({
                        "name": "Card_ARPUMetric",
                        "title": "Average Revenue / User (ARPU)",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.ARPU"},
                        "targetQuestion": "What is our average monthly yield per active subscriber?"
                    })
                },
                {
                    "x": 950, "y": 120, "width": 290, "height": 130, "z": 4,
                    "config": json.dumps({
                        "name": "Card_GrossCashMetric",
                        "title": "Gross Billed Cash Collected",
                        "visualType": "card",
                        "query": {"Measure": "FactTransactions.Total Billed Cash"},
                        "targetQuestion": "What is the total realized cash collected across transactions?"
                    })
                },
                {
                    "x": 1260, "y": 120, "width": 310, "height": 130, "z": 5,
                    "config": json.dumps({
                        "name": "Card_FailedPaymentsMetric",
                        "title": "Payment Invoicing Failures",
                        "visualType": "card",
                        "query": {"Measure": "FactTransactions.Failed Payment Count"},
                        "targetQuestion": "How many billing attempts failed due to payment delinquency?"
                    })
                },
                {
                    "x": 1590, "y": 120, "width": 310, "height": 130, "z": 6,
                    "config": json.dumps({
                        "name": "Card_RevAtRiskExposure",
                        "title": "Revenue at Risk Exposure",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Revenue at Risk"},
                        "targetQuestion": "How much contracted ARR is at imminent risk of loss?"
                    })
                },
                # Visual 1: Monthly Billed Revenue vs Invoicing Failures
                {
                    "x": 20, "y": 270, "width": 1100, "height": 380, "z": 7,
                    "config": json.dumps({
                        "name": "Combo_BilledVsFailedPayments",
                        "title": "Monthly Cash Collections vs Failed Payment Transactions",
                        "subtitle": "Business Question: Are involuntary churn indicators (failed credit cards / billing declines) increasing?",
                        "visualType": "lineClusteredColumnComboChart",
                        "x": "DimDate.year_month",
                        "y_column": "FactTransactions.amount",
                        "y_line": "FactTransactions.Failed Payment Count"
                    })
                },
                # Visual 2: Revenue at Risk Breakdown by Plan & Region
                {
                    "x": 1140, "y": 270, "width": 760, "height": 380, "z": 8,
                    "config": json.dumps({
                        "name": "Donut_RevAtRiskByPlan",
                        "title": "Revenue at Risk Distribution Across Plan Tiers",
                        "subtitle": "Business Question: Is our revenue exposure concentrated in high-touch Enterprise or entry-tier accounts?",
                        "visualType": "donutChart",
                        "legend": "DimPlan.plan_name",
                        "values": "DimCustomer.Revenue at Risk"
                    })
                },
                # Visual 3: Top Vulnerable Accounts by ARR at Risk Table
                {
                    "x": 20, "y": 670, "width": 1880, "height": 380, "z": 9,
                    "config": json.dumps({
                        "name": "Table_VulnerableRevenueAccounts",
                        "title": "Top Accounts Ranked by Annual Recurring Revenue at Risk",
                        "subtitle": "Business Question: Which specific high-value customer accounts present the largest immediate revenue risk?",
                        "visualType": "tableEx",
                        "columns": [
                            "DimCustomer.customer_id",
                            "DimCustomer.full_name",
                            "DimPlan.plan_name",
                            "DimContract.contract_type",
                            "DimCustomer.current_arr",
                            "DimCustomer.churn_probability",
                            "DimCustomer.risk_tier",
                            "DimCustomer.primary_risk_factor",
                            "DimCustomer.retention_playbook"
                        ]
                    })
                }
            ]
        },

        # =====================================================================
        # PAGE 6: Churn Prediction
        # =====================================================================
        {
            "name": "Section_ChurnPrediction",
            "displayName": "Churn Prediction",
            "filters": "[]",
            "height": 1080,
            "width": 1920,
            "config": json.dumps({
                "subtitle": "Supervised machine learning predictions, SHAP explainability attribution, and proactive intervention roster"
            }),
            "visualContainers": [
                # Header Banner
                {
                    "x": 20, "y": 20, "width": 1880, "height": 80, "z": 0,
                    "config": json.dumps({
                        "name": "Header_Predictions",
                        "title": "CUSTOMER360 | Machine Learning Churn Prediction & Risk Roster",
                        "subtitle": "Business Question: Which active accounts are predicted to churn and what are their primary root-cause risk drivers?",
                        "visualType": "textbox"
                    })
                },
                # ML Model Performance & Risk Tier KPIs
                {
                    "x": 20, "y": 120, "width": 450, "height": 130, "z": 1,
                    "config": json.dumps({
                        "name": "Card_MLModelAUC",
                        "title": "Champion Model: XGBoost ROC-AUC",
                        "visualType": "card",
                        "targetQuestion": "How accurately does the ML model rank customer attrition hazard?"
                    })
                },
                {
                    "x": 490, "y": 120, "width": 450, "height": 130, "z": 2,
                    "config": json.dumps({
                        "name": "Card_CriticalAccounts",
                        "title": "Critical / High-Risk Accounts",
                        "visualType": "card",
                        "query": {"Filter": "risk_tier IN ('Critical', 'High')", "Measure": "DimCustomer.Active Customers"},
                        "targetQuestion": "How many active accounts require immediate Customer Success outreach?"
                    })
                },
                {
                    "x": 960, "y": 120, "width": 450, "height": 130, "z": 3,
                    "config": json.dumps({
                        "name": "Card_PredRevAtRisk",
                        "title": "Model-Predicted Revenue at Risk",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Revenue at Risk"},
                        "targetQuestion": "What is the total ARR at risk identified by machine learning?"
                    })
                },
                {
                    "x": 1430, "y": 120, "width": 470, "height": 130, "z": 4,
                    "config": json.dumps({
                        "name": "Card_AvgChurnProbability",
                        "title": "Average Portfolio Churn Probability",
                        "visualType": "card",
                        "query": {"Measure": "DimCustomer.Average Churn Probability"},
                        "targetQuestion": "What is the mean predicted attrition likelihood across active subscribers?"
                    })
                },
                # Visual 1: Churn Probability Distribution Histogram
                {
                    "x": 20, "y": 270, "width": 930, "height": 380, "z": 5,
                    "config": json.dumps({
                        "name": "Histogram_ChurnProbability",
                        "title": "Distribution of Predicted Churn Probabilities",
                        "subtitle": "Business Question: Are churn risks concentrated in a small acute cohort or diffused across accounts?",
                        "visualType": "columnChart",
                        "category": "DimCustomer.risk_tier",
                        "values": ["DimCustomer.Active Customers", "DimCustomer.Revenue at Risk"]
                    })
                },
                # Visual 2: SHAP Feature Attribution / Primary Risk Drivers
                {
                    "x": 970, "y": 270, "width": 930, "height": 380, "z": 6,
                    "config": json.dumps({
                        "name": "Bar_PrimaryRiskFactors",
                        "title": "Top Risk Drivers Identified by SHAP Explainability",
                        "subtitle": "Business Question: What behavioral root causes (contract commitment, session decline, ticket friction) drive risk scores?",
                        "visualType": "barChart",
                        "category": "DimCustomer.primary_risk_factor",
                        "values": ["DimCustomer.Active Customers", "DimCustomer.Revenue at Risk"]
                    })
                },
                # Visual 3: High-Risk Account Intervention Watchlist
                {
                    "x": 20, "y": 670, "width": 1880, "height": 380, "z": 7,
                    "config": json.dumps({
                        "name": "Table_HighRiskWatchlist",
                        "title": "Actionable High-Risk Account Watchlist for Customer Success Intervention",
                        "subtitle": "Business Question: Which specific customer accounts should CSMs contact this week, and with what specific retention playbook?",
                        "visualType": "tableEx",
                        "columns": [
                            "DimCustomer.customer_id",
                            "DimCustomer.full_name",
                            "DimCustomer.email",
                            "DimPlan.plan_name",
                            "DimContract.contract_type",
                            "DimCustomer.current_arr",
                            "DimCustomer.churn_probability",
                            "DimCustomer.risk_tier",
                            "DimCustomer.primary_risk_factor",
                            "DimCustomer.retention_playbook"
                        ]
                    })
                }
            ]
        }
    ]
}

with open(REPORT_PATH, "w") as f:
    json.dump(report, f, indent=2)

print(f"Power BI Report layout successfully generated at {REPORT_PATH}")
print(f"Total Pages: {len(report['sections'])}")
for i, s in enumerate(report['sections'], 1):
    print(f"  Page {i}: {s['displayName']} ({len(s['visualContainers'])} visuals)")
