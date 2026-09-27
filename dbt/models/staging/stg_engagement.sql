WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'customer_engagement') }}
),

renamed_and_cast AS (
    SELECT
        CAST(engagement_id AS VARCHAR) AS engagement_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(date AS DATE) AS engagement_date,
        CAST(sessions AS INTEGER) AS sessions,
        CAST(session_duration AS DECIMAL(10, 2)) AS session_duration_minutes,
        CAST(logins AS INTEGER) AS logins,
        CAST(features_used AS INTEGER) AS features_used,
        CAST(active_days AS INTEGER) AS active_days,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
