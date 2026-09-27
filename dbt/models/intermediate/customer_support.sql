WITH support_tickets AS (
    SELECT * FROM {{ ref('stg_support') }}
)

SELECT
    customer_id,
    COUNT(ticket_id) AS total_tickets_count,
    SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END) AS high_urgency_tickets_count,
    SUM(CASE WHEN category = 'billing' THEN 1 ELSE 0 END) AS billing_tickets_count,
    SUM(CASE WHEN category = 'technical_issue' THEN 1 ELSE 0 END) AS technical_tickets_count,
    SUM(CASE WHEN category = 'cancellation_request' THEN 1 ELSE 0 END) AS cancellation_tickets_count,
    ROUND(AVG(resolution_time_hours), 2) AS avg_resolution_hours,
    ROUND(AVG(satisfaction_score), 2) AS avg_satisfaction_score,
    MAX(created_at) AS last_ticket_created_at,
    CASE 
        WHEN AVG(satisfaction_score) <= 2.5 OR SUM(CASE WHEN priority IN ('high', 'urgent') THEN 1 ELSE 0 END) >= 2 
        THEN TRUE 
        ELSE FALSE 
    END AS has_support_friction
FROM support_tickets
GROUP BY customer_id
