-- Make agency_id nullable for demo users
-- This allows demo users to exist without being tied to a real agency

ALTER TABLE agency_users 
ALTER COLUMN agency_id DROP NOT NULL;

-- Add a check constraint to ensure non-demo users still have an agency
ALTER TABLE agency_users
ADD CONSTRAINT agency_users_agency_id_check 
CHECK (
  (is_demo_user = true) OR 
  (is_demo_user = false AND agency_id IS NOT NULL)
);

COMMENT ON CONSTRAINT agency_users_agency_id_check ON agency_users IS 
'Ensures that non-demo users must have an agency_id, while demo users can have NULL agency_id';
