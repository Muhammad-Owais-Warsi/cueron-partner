-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Channel Preferences
    enable_push BOOLEAN DEFAULT true,
    enable_email BOOLEAN DEFAULT true,
    enable_sms BOOLEAN DEFAULT false,
    
    -- Notification Type Preferences
    notification_types JSONB DEFAULT '{
        "job_assigned": true,
        "job_accepted": true,
        "job_status_update": true,
        "job_completed": true,
        "payment_received": true,
        "payment_pending": true,
        "engineer_added": true,
        "agency_approved": true,
        "system_alert": true
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Index
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
