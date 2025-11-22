-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================

-- Enable Realtime for specific tables
-- This allows clients to subscribe to changes in real-time

-- Enable realtime on jobs table for live job updates
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- Enable realtime on engineers table for location tracking
ALTER PUBLICATION supabase_realtime ADD TABLE engineers;

-- Enable realtime on job_status_history for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE job_status_history;

-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime on payments table for payment status updates
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- ============================================================================
-- REALTIME BROADCAST FUNCTIONS
-- ============================================================================

-- Function to broadcast job assignment to agency
CREATE OR REPLACE FUNCTION broadcast_job_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.assigned_agency_id IS DISTINCT FROM NEW.assigned_agency_id AND NEW.assigned_agency_id IS NOT NULL) THEN
        -- Broadcast to agency channel
        PERFORM pg_notify(
            'agency:' || NEW.assigned_agency_id::text,
            json_build_object(
                'event', 'job_assigned',
                'job_id', NEW.id,
                'job_number', NEW.job_number,
                'urgency', NEW.urgency,
                'scheduled_time', NEW.scheduled_time
            )::text
        );
    END IF;
    
    IF (TG_OP = 'UPDATE' AND OLD.assigned_engineer_id IS DISTINCT FROM NEW.assigned_engineer_id AND NEW.assigned_engineer_id IS NOT NULL) THEN
        -- Broadcast to engineer channel
        PERFORM pg_notify(
            'engineer:' || NEW.assigned_engineer_id::text,
            json_build_object(
                'event', 'job_assigned',
                'job_id', NEW.id,
                'job_number', NEW.job_number,
                'client_name', NEW.client_name,
                'site_location', NEW.site_location
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_job_assignment_trigger
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION broadcast_job_assignment();

-- Function to broadcast job status changes
CREATE OR REPLACE FUNCTION broadcast_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Broadcast to job-specific channel
        PERFORM pg_notify(
            'job:' || NEW.id::text,
            json_build_object(
                'event', 'status_changed',
                'job_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'timestamp', NOW()
            )::text
        );
        
        -- Broadcast to agency channel
        IF NEW.assigned_agency_id IS NOT NULL THEN
            PERFORM pg_notify(
                'agency:' || NEW.assigned_agency_id::text,
                json_build_object(
                    'event', 'job_status_changed',
                    'job_id', NEW.id,
                    'job_number', NEW.job_number,
                    'status', NEW.status,
                    'engineer_id', NEW.assigned_engineer_id
                )::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_job_status_trigger
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION broadcast_job_status_change();

-- Function to broadcast engineer location updates
CREATE OR REPLACE FUNCTION broadcast_engineer_location()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.current_location IS DISTINCT FROM NEW.current_location) THEN
        -- Broadcast to agency channel
        PERFORM pg_notify(
            'agency:' || NEW.agency_id::text,
            json_build_object(
                'event', 'engineer_location_updated',
                'engineer_id', NEW.id,
                'engineer_name', NEW.name,
                'location', ST_AsGeoJSON(NEW.current_location)::json,
                'timestamp', NEW.last_location_update
            )::text
        );
        
        -- If engineer is on a job, broadcast to job channel
        IF NEW.availability_status = 'on_job' THEN
            PERFORM pg_notify(
                'job:' || (SELECT id FROM jobs WHERE assigned_engineer_id = NEW.id AND status IN ('accepted', 'travelling', 'onsite') LIMIT 1)::text,
                json_build_object(
                    'event', 'engineer_location_updated',
                    'engineer_id', NEW.id,
                    'location', ST_AsGeoJSON(NEW.current_location)::json,
                    'timestamp', NEW.last_location_update
                )::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_engineer_location_trigger
AFTER UPDATE ON engineers
FOR EACH ROW
EXECUTE FUNCTION broadcast_engineer_location();

-- Function to broadcast payment status changes
CREATE OR REPLACE FUNCTION broadcast_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Broadcast to agency channel
        IF NEW.agency_id IS NOT NULL THEN
            PERFORM pg_notify(
                'agency:' || NEW.agency_id::text,
                json_build_object(
                    'event', 'payment_status_changed',
                    'payment_id', NEW.id,
                    'job_id', NEW.job_id,
                    'status', NEW.status,
                    'amount', NEW.amount
                )::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_payment_status_trigger
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION broadcast_payment_status();

-- ============================================================================
-- REALTIME CHANNEL HELPERS
-- ============================================================================

-- Function to get active jobs for realtime subscription
CREATE OR REPLACE FUNCTION get_active_jobs_for_agency(agency_uuid UUID)
RETURNS TABLE (
    job_id UUID,
    job_number VARCHAR,
    status job_status,
    engineer_id UUID,
    engineer_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.job_number,
        j.status,
        j.assigned_engineer_id,
        e.name
    FROM jobs j
    LEFT JOIN engineers e ON e.id = j.assigned_engineer_id
    WHERE j.assigned_agency_id = agency_uuid
    AND j.status NOT IN ('completed', 'cancelled')
    ORDER BY j.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active engineers for realtime tracking
CREATE OR REPLACE FUNCTION get_active_engineers_for_agency(agency_uuid UUID)
RETURNS TABLE (
    engineer_id UUID,
    engineer_name VARCHAR,
    availability_status availability_status,
    current_location JSON,
    last_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.availability_status,
        ST_AsGeoJSON(e.current_location)::json,
        e.last_location_update
    FROM engineers e
    WHERE e.agency_id = agency_uuid
    AND e.availability_status IN ('on_job', 'available')
    ORDER BY e.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REALTIME PRESENCE TRACKING
-- ============================================================================

-- Table to track online users (for presence feature)
CREATE TABLE user_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'agency_user' or 'engineer'
    
    -- Presence Info
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    -- Device Info
    device_type VARCHAR(20),
    app_version VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, user_type)
);

-- Index for presence queries
CREATE INDEX idx_user_presence_user ON user_presence(user_id);
CREATE INDEX idx_user_presence_online ON user_presence(is_online) WHERE is_online = true;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_user_type VARCHAR,
    p_device_type VARCHAR DEFAULT NULL,
    p_app_version VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_presence (user_id, user_type, device_type, app_version, is_online, last_seen)
    VALUES (p_user_id, p_user_type, p_device_type, p_app_version, true, NOW())
    ON CONFLICT (user_id, user_type)
    DO UPDATE SET
        is_online = true,
        last_seen = NOW(),
        device_type = COALESCE(EXCLUDED.device_type, user_presence.device_type),
        app_version = COALESCE(EXCLUDED.app_version, user_presence.app_version),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as offline
CREATE OR REPLACE FUNCTION mark_user_offline(p_user_id UUID, p_user_type VARCHAR)
RETURNS void AS $$
BEGIN
    UPDATE user_presence
    SET is_online = false, updated_at = NOW()
    WHERE user_id = p_user_id AND user_type = p_user_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old presence records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
    -- Mark users as offline if last seen > 5 minutes ago
    UPDATE user_presence
    SET is_online = false
    WHERE is_online = true
    AND last_seen < NOW() - INTERVAL '5 minutes';
    
    -- Delete old offline records (> 30 days)
    DELETE FROM user_presence
    WHERE is_online = false
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_presence IS 'Tracks online/offline status of users for realtime presence features';
COMMENT ON FUNCTION broadcast_job_assignment IS 'Broadcasts job assignment events to agency and engineer channels';
COMMENT ON FUNCTION broadcast_job_status_change IS 'Broadcasts job status changes to relevant channels';
COMMENT ON FUNCTION broadcast_engineer_location IS 'Broadcasts engineer location updates to agency and job channels';
COMMENT ON FUNCTION broadcast_payment_status IS 'Broadcasts payment status changes to agency channels';
