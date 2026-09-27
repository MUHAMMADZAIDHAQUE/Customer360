WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'payments') }}
),

renamed_and_cast AS (
    SELECT
        CAST(payment_id AS VARCHAR) AS payment_id,
        CAST(transaction_id AS VARCHAR) AS transaction_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(payment_date AS TIMESTAMP) AS payment_date,
        CAST(amount AS DECIMAL(10, 2)) AS amount,
        LOWER(TRIM(payment_method)) AS payment_method,
        LOWER(TRIM(payment_gateway)) AS payment_gateway,
        LOWER(TRIM(status)) AS status,
        failure_reason,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
