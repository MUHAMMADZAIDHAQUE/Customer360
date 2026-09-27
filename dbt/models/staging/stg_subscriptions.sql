WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'subscriptions') }}
),

renamed_and_cast AS (
    SELECT
        CAST(subscription_id AS VARCHAR) AS subscription_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(plan_id AS VARCHAR) AS plan_id,
        LOWER(TRIM(contract_type)) AS contract_type,
        CAST(start_date AS DATE) AS start_date,
        CAST(end_date AS DATE) AS end_date,
        CAST(monthly_price AS DECIMAL(10, 2)) AS monthly_price,
        LOWER(TRIM(status)) AS status,
        CAST(auto_renew AS BOOLEAN) AS is_auto_renew,
        cancellation_reason,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
