WITH source AS (
    SELECT * FROM {{ source('raw_parquet', 'support_tickets') }}
),

renamed_and_cast AS (
    SELECT
        CAST(ticket_id AS VARCHAR) AS ticket_id,
        CAST(customer_id AS VARCHAR) AS customer_id,
        CAST(created_at AS TIMESTAMP) AS created_at,
        CAST(resolved_at AS TIMESTAMP) AS resolved_at,
        LOWER(TRIM(category)) AS category,
        LOWER(TRIM(priority)) AS priority,
        CAST(resolution_time AS DECIMAL(8, 2)) AS resolution_time_hours,
        CAST(satisfaction_score AS INTEGER) AS satisfaction_score,
        LOWER(TRIM(status)) AS status
    FROM source
)

SELECT * FROM renamed_and_cast
