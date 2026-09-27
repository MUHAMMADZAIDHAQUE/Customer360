WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'churn_events') }}
),

renamed_and_cast AS (
    SELECT
        CAST(churn_id AS VARCHAR) AS churn_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(subscription_id AS VARCHAR) AS subscription_id,
        CAST(churn_date AS DATE) AS churn_date,
        LOWER(TRIM(churn_reason)) AS churn_reason,
        LOWER(TRIM(churn_type)) AS churn_type,
        feedback,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
