WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'plans') }}
),

renamed_and_cast AS (
    SELECT
        CAST(plan_id AS VARCHAR) AS plan_id,
        TRIM(plan_name) AS plan_name,
        TRIM(tier) AS tier,
        CAST(monthly_price AS DECIMAL(10, 2)) AS monthly_price,
        CAST(annual_price AS DECIMAL(10, 2)) AS annual_price,
        CAST(max_seats AS INTEGER) AS max_seats,
        features_included,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
