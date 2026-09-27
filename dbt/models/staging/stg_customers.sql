WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'customers') }}
),

renamed_and_cast AS (
    SELECT
        CAST(customer_id AS VARCHAR) AS customer_id,
        TRIM(first_name) AS first_name,
        TRIM(last_name) AS last_name,
        TRIM(first_name) || ' ' || TRIM(last_name) AS full_name,
        LOWER(TRIM(email)) AS email,
        CAST(age AS INTEGER) AS age,
        TRIM(gender) AS gender,
        TRIM(country) AS country,
        TRIM(region) AS region,
        TRIM(city) AS city,
        CAST(signup_date AS DATE) AS signup_date,
        TRIM(acquisition_channel) AS acquisition_channel,
        LOWER(TRIM(customer_status)) AS customer_status,
        CAST(created_at AS TIMESTAMP) AS created_at
    FROM source
)

SELECT * FROM renamed_and_cast
