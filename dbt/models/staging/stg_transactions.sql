WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'transactions') }}
),

renamed_and_cast AS (
    SELECT
        CAST(transaction_id AS VARCHAR) AS transaction_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(subscription_id AS VARCHAR) AS subscription_id,
        CAST(transaction_date AS TIMESTAMP) AS transaction_date,
        CAST(transaction_date AS DATE) AS transaction_day,
        CAST(amount AS DECIMAL(10, 2)) AS amount,
        LOWER(TRIM(transaction_type)) AS transaction_type,
        LOWER(TRIM(payment_method)) AS payment_method,
        LOWER(TRIM(payment_status)) AS payment_status,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
