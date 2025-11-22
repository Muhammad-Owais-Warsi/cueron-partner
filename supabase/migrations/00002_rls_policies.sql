-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get user's agency ID
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT agency_id 
        FROM agency_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is agency admin
CREATE OR REPLACE FUNCTION is_agency_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM agency_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is agency manager or admin
CREATE OR REPLACE FUNCTION is_agency_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM agency_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an engineer
CREATE OR REPLACE FUNCTION is_engineer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM engineers 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get engineer ID for current user
CREATE OR REPLACE FUNCTION get_engineer_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM engineers 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AGENCIES TABLE POLICIES
-- ============================================================================

-- Agencies can view their own data
CREATE POLICY "Agencies can view own data"
ON agencies FOR SELECT
USING (
    id = get_user_agency_id()
);

-- Admins can update their own agency
CREATE POLICY "Admins can update own agency"
ON agencies FOR UPDATE
USING (
    id = get_user_agency_id() 
    AND is_agency_admin()
)
WITH CHECK (
    id = get_user_agency_id()
);

-- Allow agency registration (insert without authentication)
CREATE POLICY "Allow agency registration"
ON agencies FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- ENGINEERS TABLE POLICIES
-- ============================================================================

-- Agencies can view their own engineers
CREATE POLICY "Agencies can view own engineers"
ON engineers FOR SELECT
USING (
    agency_id = get_user_agency_id()
);

-- Engineers can view their own profile
CREATE POLICY "Engineers can view own profile"
ON engineers FOR SELECT
USING (
    user_id = auth.uid()
);

-- Managers and admins can insert engineers
CREATE POLICY "Managers can add engineers"
ON engineers FOR INSERT
WITH CHECK (
    agency_id = get_user_agency_id()
    AND is_agency_manager_or_admin()
);

-- Managers and admins can update their engineers
CREATE POLICY "Managers can update engineers"
ON engineers FOR UPDATE
USING (
    agency_id = get_user_agency_id()
    AND is_agency_manager_or_admin()
)
WITH CHECK (
    agency_id = get_user_agency_id()
);

-- Engineers can update their own profile (limited fields)
CREATE POLICY "Engineers can update own profile"
ON engineers FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

-- Agencies can view jobs assigned to them
CREATE POLICY "Agencies can view assigned jobs"
ON jobs FOR SELECT
USING (
    assigned_agency_id = get_user_agency_id()
);

-- Engineers can view their assigned jobs
CREATE POLICY "Engineers can view assigned jobs"
ON jobs FOR SELECT
USING (
    assigned_engineer_id = get_engineer_id()
);

-- Managers and admins can update jobs
CREATE POLICY "Managers can update jobs"
ON jobs FOR UPDATE
USING (
    assigned_agency_id = get_user_agency_id()
    AND is_agency_manager_or_admin()
)
WITH CHECK (
    assigned_agency_id = get_user_agency_id()
);

-- Engineers can update their assigned jobs (limited fields)
CREATE POLICY "Engineers can update assigned jobs"
ON jobs FOR UPDATE
USING (
    assigned_engineer_id = get_engineer_id()
)
WITH CHECK (
    assigned_engineer_id = get_engineer_id()
);

-- Allow job creation (system/admin level)
CREATE POLICY "Allow job creation"
ON jobs FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- JOB STATUS HISTORY POLICIES
-- ============================================================================

-- Agencies can view status history for their jobs
CREATE POLICY "Agencies can view job status history"
ON job_status_history FOR SELECT
USING (
    job_id IN (
        SELECT id FROM jobs WHERE assigned_agency_id = get_user_agency_id()
    )
);

-- Engineers can view status history for their jobs
CREATE POLICY "Engineers can view job status history"
ON job_status_history FOR SELECT
USING (
    job_id IN (
        SELECT id FROM jobs WHERE assigned_engineer_id = get_engineer_id()
    )
);

-- Allow status history creation (triggered automatically)
CREATE POLICY "Allow status history creation"
ON job_status_history FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Agencies can view their own payments
CREATE POLICY "Agencies can view own payments"
ON payments FOR SELECT
USING (
    agency_id = get_user_agency_id()
);

-- Admins can view payment details
CREATE POLICY "Admins can view payments"
ON payments FOR SELECT
USING (
    agency_id = get_user_agency_id()
    AND is_agency_admin()
);

-- Allow payment creation (system level)
CREATE POLICY "Allow payment creation"
ON payments FOR INSERT
WITH CHECK (true);

-- Allow payment updates (system level for payment processing)
CREATE POLICY "Allow payment updates"
ON payments FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- AGENCY USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own agency user record
CREATE POLICY "Users can view own record"
ON agency_users FOR SELECT
USING (
    user_id = auth.uid()
);

-- Admins can view all users in their agency
CREATE POLICY "Admins can view agency users"
ON agency_users FOR SELECT
USING (
    agency_id = get_user_agency_id()
    AND is_agency_admin()
);

-- Admins can add users to their agency
CREATE POLICY "Admins can add users"
ON agency_users FOR INSERT
WITH CHECK (
    agency_id = get_user_agency_id()
    AND is_agency_admin()
);

-- Admins can update users in their agency
CREATE POLICY "Admins can update users"
ON agency_users FOR UPDATE
USING (
    agency_id = get_user_agency_id()
    AND is_agency_admin()
)
WITH CHECK (
    agency_id = get_user_agency_id()
);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (
    user_id = auth.uid()
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- Allow notification creation (system level)
CREATE POLICY "Allow notification creation"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- FCM TOKENS TABLE POLICIES
-- ============================================================================

-- Users can view their own FCM tokens
CREATE POLICY "Users can view own tokens"
ON fcm_tokens FOR SELECT
USING (
    user_id = auth.uid()
);

-- Users can insert their own FCM tokens
CREATE POLICY "Users can insert own tokens"
ON fcm_tokens FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own FCM tokens
CREATE POLICY "Users can update own tokens"
ON fcm_tokens FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- Users can delete their own FCM tokens
CREATE POLICY "Users can delete own tokens"
ON fcm_tokens FOR DELETE
USING (
    user_id = auth.uid()
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
