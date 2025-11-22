-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS AND REPORTING
-- ============================================================================

-- Agency Monthly Metrics Materialized View
CREATE MATERIALIZED VIEW agency_monthly_metrics AS
SELECT 
    a.id AS agency_id,
    a.name AS agency_name,
    DATE_TRUNC('month', j.completed_at) AS month,
    
    -- Job Metrics
    COUNT(j.id) AS jobs_completed,
    COUNT(DISTINCT j.assigned_engineer_id) AS engineers_utilized,
    
    -- Revenue Metrics
    COALESCE(SUM(j.service_fee), 0) AS total_revenue,
    COALESCE(AVG(j.service_fee), 0) AS avg_job_value,
    
    -- Performance Metrics
    COALESCE(AVG(j.client_rating), 0) AS avg_rating,
    COUNT(CASE WHEN j.client_rating >= 4 THEN 1 END) AS positive_ratings,
    
    -- Time Metrics
    COALESCE(AVG(EXTRACT(EPOCH FROM (j.completed_at - j.assigned_at)) / 3600), 0) AS avg_completion_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (j.started_at - j.assigned_at)) / 3600), 0) AS avg_response_hours,
    
    -- Job Type Distribution
    COUNT(CASE WHEN j.job_type = 'AMC' THEN 1 END) AS amc_jobs,
    COUNT(CASE WHEN j.job_type = 'Repair' THEN 1 END) AS repair_jobs,
    COUNT(CASE WHEN j.job_type = 'Installation' THEN 1 END) AS installation_jobs,
    COUNT(CASE WHEN j.job_type = 'Emergency' THEN 1 END) AS emergency_jobs,
    
    -- Success Metrics
    COUNT(CASE WHEN j.status = 'completed' THEN 1 END) AS successful_jobs,
    COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) AS cancelled_jobs,
    
    -- Last Updated
    NOW() AS last_refreshed

FROM agencies a
LEFT JOIN jobs j ON j.assigned_agency_id = a.id 
    AND j.status = 'completed'
    AND j.completed_at IS NOT NULL
WHERE a.status = 'active'
GROUP BY a.id, a.name, DATE_TRUNC('month', j.completed_at);

-- Create indexes on materialized view
CREATE INDEX idx_agency_monthly_metrics_agency ON agency_monthly_metrics(agency_id);
CREATE INDEX idx_agency_monthly_metrics_month ON agency_monthly_metrics(month);

-- ============================================================================
-- ENGINEER PERFORMANCE VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW engineer_performance_metrics AS
SELECT 
    e.id AS engineer_id,
    e.name AS engineer_name,
    e.agency_id,
    
    -- Job Metrics
    COUNT(j.id) AS total_jobs,
    COUNT(CASE WHEN j.status = 'completed' THEN 1 END) AS completed_jobs,
    COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) AS cancelled_jobs,
    
    -- Success Rate
    CASE 
        WHEN COUNT(j.id) > 0 THEN
            (COUNT(CASE WHEN j.status = 'completed' THEN 1 END)::DECIMAL / COUNT(j.id) * 100)
        ELSE 0
    END AS success_rate,
    
    -- Rating Metrics
    COALESCE(AVG(j.client_rating), 0) AS avg_rating,
    COUNT(CASE WHEN j.client_rating IS NOT NULL THEN 1 END) AS total_ratings,
    COUNT(CASE WHEN j.client_rating >= 4 THEN 1 END) AS positive_ratings,
    
    -- Time Metrics
    COALESCE(AVG(EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) / 3600), 0) AS avg_service_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (j.started_at - j.accepted_at)) / 3600), 0) AS avg_travel_hours,
    
    -- Revenue Contribution
    COALESCE(SUM(j.service_fee), 0) AS total_revenue_generated,
    
    -- Job Type Experience
    COUNT(CASE WHEN j.job_type = 'AMC' THEN 1 END) AS amc_experience,
    COUNT(CASE WHEN j.job_type = 'Repair' THEN 1 END) AS repair_experience,
    COUNT(CASE WHEN j.job_type = 'Installation' THEN 1 END) AS installation_experience,
    COUNT(CASE WHEN j.job_type = 'Emergency' THEN 1 END) AS emergency_experience,
    
    -- Current Status
    e.availability_status,
    e.skill_level,
    
    -- Last Updated
    NOW() AS last_refreshed

FROM engineers e
LEFT JOIN jobs j ON j.assigned_engineer_id = e.id
GROUP BY e.id, e.name, e.agency_id, e.availability_status, e.skill_level;

-- Create indexes on engineer performance view
CREATE INDEX idx_engineer_performance_engineer ON engineer_performance_metrics(engineer_id);
CREATE INDEX idx_engineer_performance_agency ON engineer_performance_metrics(agency_id);

-- ============================================================================
-- JOB ANALYTICS VIEW
-- ============================================================================

CREATE VIEW job_analytics AS
SELECT 
    j.id,
    j.job_number,
    j.job_type,
    j.status,
    j.urgency,
    j.assigned_agency_id,
    j.assigned_engineer_id,
    
    -- Time Calculations
    j.assigned_at,
    j.accepted_at,
    j.started_at,
    j.completed_at,
    
    EXTRACT(EPOCH FROM (j.accepted_at - j.assigned_at)) / 3600 AS hours_to_accept,
    EXTRACT(EPOCH FROM (j.started_at - j.accepted_at)) / 3600 AS hours_to_start,
    EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) / 3600 AS hours_to_complete,
    EXTRACT(EPOCH FROM (j.completed_at - j.assigned_at)) / 3600 AS total_hours,
    
    -- Location
    j.site_location->>'city' AS city,
    j.site_location->>'state' AS state,
    
    -- Financial
    j.service_fee,
    j.payment_status,
    
    -- Quality
    j.client_rating,
    CASE 
        WHEN j.client_rating >= 4 THEN 'Positive'
        WHEN j.client_rating >= 2 THEN 'Neutral'
        WHEN j.client_rating IS NOT NULL THEN 'Negative'
        ELSE 'Not Rated'
    END AS rating_category,
    
    -- Completion Status
    CASE 
        WHEN j.status = 'completed' THEN true
        ELSE false
    END AS is_completed,
    
    CASE 
        WHEN j.status = 'cancelled' THEN true
        ELSE false
    END AS is_cancelled

FROM jobs j;

-- ============================================================================
-- REAL-TIME DASHBOARD VIEW
-- ============================================================================

CREATE VIEW dashboard_realtime AS
SELECT 
    a.id AS agency_id,
    a.name AS agency_name,
    
    -- Today's Jobs
    COUNT(CASE 
        WHEN j.scheduled_time::DATE = CURRENT_DATE 
        THEN 1 
    END) AS jobs_today,
    
    -- Active Engineers
    COUNT(CASE 
        WHEN e.availability_status = 'on_job' 
        THEN 1 
    END) AS active_engineers,
    
    -- Available Engineers
    COUNT(CASE 
        WHEN e.availability_status = 'available' 
        THEN 1 
    END) AS available_engineers,
    
    -- Pending Jobs
    COUNT(CASE 
        WHEN j.status IN ('pending', 'assigned') 
        THEN 1 
    END) AS pending_jobs,
    
    -- In Progress Jobs
    COUNT(CASE 
        WHEN j.status IN ('accepted', 'travelling', 'onsite') 
        THEN 1 
    END) AS in_progress_jobs,
    
    -- Completed Today
    COUNT(CASE 
        WHEN j.status = 'completed' 
        AND j.completed_at::DATE = CURRENT_DATE 
        THEN 1 
    END) AS completed_today,
    
    -- Pending Payments
    COUNT(CASE 
        WHEN p.status = 'pending' 
        THEN 1 
    END) AS pending_payments,
    
    -- Monthly Revenue (Current Month)
    COALESCE(SUM(CASE 
        WHEN j.status = 'completed' 
        AND DATE_TRUNC('month', j.completed_at) = DATE_TRUNC('month', CURRENT_DATE)
        THEN j.service_fee 
    END), 0) AS monthly_revenue,
    
    -- Average Rating (Current Month)
    COALESCE(AVG(CASE 
        WHEN j.client_rating IS NOT NULL
        AND DATE_TRUNC('month', j.completed_at) = DATE_TRUNC('month', CURRENT_DATE)
        THEN j.client_rating 
    END), 0) AS monthly_avg_rating

FROM agencies a
LEFT JOIN engineers e ON e.agency_id = a.id
LEFT JOIN jobs j ON j.assigned_agency_id = a.id
LEFT JOIN payments p ON p.agency_id = a.id
WHERE a.status = 'active'
GROUP BY a.id, a.name;

-- ============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh agency monthly metrics
CREATE OR REPLACE FUNCTION refresh_agency_monthly_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY agency_monthly_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh engineer performance metrics
CREATE OR REPLACE FUNCTION refresh_engineer_performance_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY engineer_performance_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all analytics views
CREATE OR REPLACE FUNCTION refresh_all_analytics()
RETURNS void AS $$
BEGIN
    PERFORM refresh_agency_monthly_metrics();
    PERFORM refresh_engineer_performance_metrics();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED REFRESH (Optional - requires pg_cron extension)
-- ============================================================================

-- Uncomment if pg_cron is available
-- SELECT cron.schedule('refresh-analytics', '0 2 * * *', 'SELECT refresh_all_analytics()');
