// ============================================================================
// Customer360 - Power Query (M) Transformation Scripts
// ============================================================================
// Provides production-ready M code to ingest either local Parquet / CSV extracts
// or connect directly to PostgreSQL views (pbi.dim_* and pbi.fact_*).
// Use these queries in Power BI Power Query Advanced Editor.

// ----------------------------------------------------------------------------
// Parameters
// ----------------------------------------------------------------------------
// FilePath Parameter: Change this to your local repository directory
// e.g. "C:\Customer360\powerbi\data\" or "/Users/zaidhaque/Desktop/Customer360/powerbi/data/"
let
    DataDirectory = "/Users/zaidhaque/Desktop/Customer360/powerbi/data/" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]
in
    DataDirectory

// ----------------------------------------------------------------------------
// 1. DimCustomer (Unified 360 attributes, RFM segments, ML churn predictions)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimCustomer.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"customer_id", type text},
        {"full_name", type text},
        {"email", type text},
        {"age", Int64.Type},
        {"age_bracket", type text},
        {"gender", type text},
        {"country", type text},
        {"region", type text},
        {"city", type text},
        {"signup_date", type date},
        {"signup_date_key", Int64.Type},
        {"acquisition_channel", type text},
        {"customer_status", type text},
        {"is_churned", type logical},
        {"plan_id", type text},
        {"contract_type", type text},
        {"current_mrr", Currency.Type},
        {"current_arr", Currency.Type},
        {"tenure_months", type number},
        {"tenure_bracket", type text},
        {"lifetime_billed_revenue", Currency.Type},
        {"is_at_risk", type logical},
        {"revenue_at_risk", Currency.Type},
        {"rfm_segment", type text},
        {"retention_playbook", type text},
        {"churn_probability", Percentage.Type},
        {"risk_tier", type text},
        {"primary_risk_factor", type text},
        {"region_id", Int64.Type},
        {"contract_id", Int64.Type},
        {"channel_id", Int64.Type}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 2. DimDate (Standard continuous date dimension)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimDate.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"date", type date},
        {"date_key", Int64.Type},
        {"year", Int64.Type},
        {"quarter", type text},
        {"year_quarter", type text},
        {"month", Int64.Type},
        {"month_name", type text},
        {"year_month", type text},
        {"week_of_year", Int64.Type},
        {"day_of_month", Int64.Type},
        {"day_of_week", Int64.Type},
        {"day_name", type text},
        {"is_weekend", type logical}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 3. DimPlan (Product plan tiers, pricing & limits)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimPlan.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"plan_id", type text},
        {"plan_name", type text},
        {"plan_tier", type text},
        {"monthly_price", Currency.Type},
        {"annual_price", Currency.Type},
        {"max_seats", Int64.Type}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 4. DimContract (Contract commitment length & billing terms)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimContract.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"contract_id", Int64.Type},
        {"contract_type", type text},
        {"billing_frequency", type text},
        {"commitment_months", Int64.Type},
        {"flexibility_tier", type text}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 5. DimRegion (Geography & Global Sales Theaters)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimRegion.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"region_id", Int64.Type},
        {"country", type text},
        {"region", type text},
        {"city", type text},
        {"global_theater", type text}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 6. DimAcquisitionChannel (Marketing acquisition channels)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "DimAcquisitionChannel.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"channel_id", Int64.Type},
        {"channel_name", type text},
        {"channel_category", type text}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 7. FactTransactions (Financial billing transactions)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "FactTransactions.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"transaction_id", type text},
        {"customer_id", type text},
        {"date_key", Int64.Type},
        {"plan_id", type text},
        {"contract_id", Int64.Type},
        {"transaction_date", type date},
        {"amount", Currency.Type},
        {"currency", type text},
        {"payment_method", type text},
        {"payment_status", type text},
        {"transaction_type", type text},
        {"is_successful", Int64.Type},
        {"is_failed", Int64.Type}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 8. FactEngagement (Monthly Customer Usage Rollup)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "FactEngagement.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"engagement_key", Int64.Type},
        {"customer_id", type text},
        {"date_key", Int64.Type},
        {"plan_id", type text},
        {"contract_id", Int64.Type},
        {"observation_month", type date},
        {"sessions_count", Int64.Type},
        {"session_minutes", type number},
        {"logins_count", Int64.Type},
        {"active_days", Int64.Type}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 9. FactSupport (Support ticket resolution & CSAT)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "FactSupport.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"ticket_id", type text},
        {"customer_id", type text},
        {"date_key", Int64.Type},
        {"plan_id", type text},
        {"contract_id", Int64.Type},
        {"created_date", type date},
        {"category", type text},
        {"priority", type text},
        {"status", type text},
        {"resolution_time_hours", type number},
        {"satisfaction_score", Int64.Type},
        {"is_escalated", Int64.Type},
        {"has_friction", Int64.Type}
    })
in
    #"Changed Type"

// ----------------------------------------------------------------------------
// 10. FactChurn (Historical attrition events & lost ARR)
// ----------------------------------------------------------------------------
let
    Source = Parquet.Document(File.Contents(DataDirectory & "FactChurn.parquet")),
    #"Changed Type" = Table.TransformColumnTypes(Source,{
        {"churn_id", type text},
        {"customer_id", type text},
        {"date_key", Int64.Type},
        {"plan_id", type text},
        {"contract_id", Int64.Type},
        {"churn_date", type date},
        {"churn_reason", type text},
        {"churn_type", type text},
        {"feedback", type text},
        {"mrr_lost", Currency.Type},
        {"arr_lost", Currency.Type},
        {"tenure_at_churn_months", type number}
    })
in
    #"Changed Type"
