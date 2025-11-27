-- Migration to allow engineers to be created without an agency
-- This removes the NOT NULL constraint on agency_id in the engineers table

-- First, drop the existing foreign key constraint
ALTER TABLE engineers DROP CONSTRAINT IF EXISTS engineers_agency_id_fkey;

-- Then, modify the agency_id column to allow NULL values
ALTER TABLE engineers ALTER COLUMN agency_id DROP NOT NULL;

-- Finally, recreate the foreign key constraint with ON DELETE SET NULL instead of CASCADE
ALTER TABLE engineers 
ADD CONSTRAINT engineers_agency_id_fkey 
FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;