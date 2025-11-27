-- SQL commands to check if mock data exists in the database

-- Check if the agency exists
SELECT 'Agency' as table_name, id, name, email, status FROM agencies WHERE email = 'test@agency.com';

-- Check if the engineer exists
SELECT 'Engineer' as table_name, id, name, email, availability_status FROM engineers WHERE email = 'engineer@test.com';

-- Check if the agency user exists
SELECT 'Agency User' as table_name, agency_id, user_id, name, email, role FROM agency_users WHERE email = 'test@agency.com';

-- Check if the job exists
SELECT 'Job' as table_name, id, job_number, client_name, status FROM jobs WHERE assigned_agency_id IN (
  SELECT id FROM agencies WHERE email = 'test@agency.com'
);

-- Check all data related to the test agency
SELECT 'All Agency Data' as info;
SELECT * FROM agencies WHERE email = 'test@agency.com';
SELECT * FROM engineers WHERE agency_id = (
  SELECT id FROM agencies WHERE email = 'test@agency.com'
);
SELECT * FROM jobs WHERE assigned_agency_id = (
  SELECT id FROM agencies WHERE email = 'test@agency.com'
);
SELECT * FROM agency_users WHERE agency_id = (
  SELECT id FROM agencies WHERE email = 'test@agency.com'
);