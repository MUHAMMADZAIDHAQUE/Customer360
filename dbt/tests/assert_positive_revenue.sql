-- Custom singular test: Return rows where total_realized_revenue is negative
SELECT
    customer_id,
    total_realized_revenue
FROM {{ ref('mart_customer_revenue') }}
WHERE total_realized_revenue < 0
