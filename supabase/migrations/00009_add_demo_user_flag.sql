-- ============================================================================
-- ADD DEMO USER FLAG TO AGENCY_USERS TABLE
-- ============================================================================
-- This migration adds support for demo/mock users who will see generated
-- demo data instead of real database data.

-- Add is_demo_user column to agency_users table
ALTER TABLE agency_users 
ADD COLUMN is_demo_user BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for efficient demo user queries
-- Partial index only indexes rows where is_demo_user = TRUE for efficiency
CREATE INDEX idx_agency_users_demo 
ON agency_users(is_demo_user) 
WHERE is_demo_user = TRUE;

-- Add comment to document the column purpose
COMMENT ON COLUMN agency_users.is_demo_user IS 
'Flag indicating if this user is a demo/mock user. Demo users see generated demo data instead of real database data.';
