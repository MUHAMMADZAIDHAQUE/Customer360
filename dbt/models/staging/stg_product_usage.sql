WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'product_usage') }}
),

renamed_and_cast AS (
    SELECT
        CAST(usage_id AS VARCHAR) AS usage_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(date AS DATE) AS usage_date,
        LOWER(TRIM(feature_name)) AS feature_name,
        CAST(usage_count AS INTEGER) AS usage_count,
        CAST(duration_seconds AS INTEGER) AS duration_seconds,
        TRIM(units) AS units,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
