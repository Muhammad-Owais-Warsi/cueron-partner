-- ============================================================================
-- Job Spatial Filtering Function
-- ============================================================================
-- This function provides efficient PostGIS-based spatial filtering for jobs
-- within a specified radius from a given point.
--
-- Requirements: 18.4 (Spatial filter accuracy)
-- Property 85: Spatial filter accuracy

-- Function to filter jobs by location using PostGIS
CREATE OR REPLACE FUNCTION filter_jobs_by_location(
    p_agency_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION,
    p_job_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    job_number VARCHAR(50),
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_number,
        ST_Distance(
            j.site_coordinates::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM jobs j
    WHERE 
        j.assigned_agency_id = p_agency_id
        AND j.site_coordinates IS NOT NULL
        AND ST_DWithin(
            j.site_coordinates::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_radius_meters
        )
        AND (p_job_ids IS NULL OR j.id = ANY(p_job_ids))
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment to function
COMMENT ON FUNCTION filter_jobs_by_location IS 
'Filters jobs within a specified radius from a given point using PostGIS spatial queries. Returns jobs with their distance from the center point.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION filter_jobs_by_location TO authenticated;

-- ============================================================================
-- Trigger to automatically populate site_coordinates from site_location JSONB
-- ============================================================================
-- This ensures that whenever site_location is updated, the PostGIS coordinates
-- are automatically synchronized for spatial queries

CREATE OR REPLACE FUNCTION sync_job_site_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract lat/lng from site_location JSONB and create PostGIS point
    IF NEW.site_location IS NOT NULL AND 
       NEW.site_location ? 'lat' AND 
       NEW.site_location ? 'lng' THEN
        
        NEW.site_coordinates := ST_SetSRID(
            ST_MakePoint(
                (NEW.site_location->>'lng')::DOUBLE PRECISION,
                (NEW.site_location->>'lat')::DOUBLE PRECISION
            ),
            4326
        )::geography;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_job_coordinates_trigger ON jobs;
CREATE TRIGGER sync_job_coordinates_trigger
    BEFORE INSERT OR UPDATE OF site_location ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION sync_job_site_coordinates();

-- Add comment to trigger
COMMENT ON TRIGGER sync_job_coordinates_trigger ON jobs IS 
'Automatically synchronizes site_coordinates PostGIS field from site_location JSONB field for spatial queries.';

-- ============================================================================
-- Backfill existing jobs with site_coordinates
-- ============================================================================
-- Update existing jobs that have site_location but no site_coordinates

UPDATE jobs
SET site_coordinates = ST_SetSRID(
    ST_MakePoint(
        (site_location->>'lng')::DOUBLE PRECISION,
        (site_location->>'lat')::DOUBLE PRECISION
    ),
    4326
)::geography
WHERE 
    site_location IS NOT NULL 
    AND site_location ? 'lat' 
    AND site_location ? 'lng'
    AND site_coordinates IS NULL;

-- ============================================================================
-- Additional helper function: Calculate distance between job and engineer
-- ============================================================================
-- This function calculates the distance between a job site and an engineer's
-- current location, useful for assignment decisions

CREATE OR REPLACE FUNCTION calculate_job_engineer_distance(
    p_job_id UUID,
    p_engineer_id UUID
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    v_distance DOUBLE PRECISION;
BEGIN
    SELECT 
        ST_Distance(
            j.site_coordinates::geography,
            e.current_location::geography
        )
    INTO v_distance
    FROM jobs j
    CROSS JOIN engineers e
    WHERE 
        j.id = p_job_id 
        AND e.id = p_engineer_id
        AND j.site_coordinates IS NOT NULL
        AND e.current_location IS NOT NULL;
    
    RETURN v_distance;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment to function
COMMENT ON FUNCTION calculate_job_engineer_distance IS 
'Calculates the distance in meters between a job site and an engineer''s current location. Returns NULL if either location is not available.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_job_engineer_distance TO authenticated;
