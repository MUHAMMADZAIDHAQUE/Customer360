-- Custom singular test: Return rows if count of customers in mart_customer_360 != count in stg_customers
WITH staged AS (
    SELECT COUNT(DISTINCT customer_id) AS stg_count FROM {{ ref('stg_customers') }}
),

mart AS (
    SELECT COUNT(DISTINCT customer_id) AS mart_count FROM {{ ref('mart_customer_360') }}
)

SELECT
    stg_count,
    mart_count
FROM staged, mart
WHERE stg_count != mart_count
