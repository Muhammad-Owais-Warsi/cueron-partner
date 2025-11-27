-- SQL commands to insert mock data for Cueron Partner Platform
-- This file can be executed directly in the Supabase SQL editor

-- Insert test agency
INSERT INTO agencies (
  id, name, type, registration_number, gstn, nsdc_code, 
  contact_person, phone, email, primary_location, service_areas,
  partnership_tier, partnership_model, engineer_capacity, status, onboarded_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Agency',
  'Service',
  'TEST-001',
  '07AAACD1234E1Z6',
  'NSDC-TEST-001',
  'Test User',
  '9876543210',
  'test@agency.com',
  '{"city": "New Delhi", "state": "Delhi", "pincode": "110001", "lat": 28.6139, "lng": 77.2090}'::jsonb,
  ARRAY['New Delhi', 'Gurgaon', 'Noida'],
  'premium',
  'dedicated_resource',
  10,
  'active',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  registration_number = EXCLUDED.registration_number,
  gstn = EXCLUDED.gstn,
  nsdc_code = EXCLUDED.nsdc_code,
  contact_person = EXCLUDED.contact_person,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  primary_location = EXCLUDED.primary_location,
  service_areas = EXCLUDED.service_areas,
  partnership_tier = EXCLUDED.partnership_tier,
  partnership_model = EXCLUDED.partnership_model,
  engineer_capacity = EXCLUDED.engineer_capacity,
  status = EXCLUDED.status,
  onboarded_at = EXCLUDED.onboarded_at;

-- Insert test engineer
INSERT INTO engineers (
  id, agency_id, name, phone, email, certifications,
  skill_level, specializations, availability_status, employment_type
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Test Engineer',
  '9876543211',
  'engineer@test.com',
  '[{"type": "ITI", "level": 3, "cert_number": "ITI-2020-001", "verified": true}]'::jsonb,
  3,
  ARRAY['Cold Storage', 'Industrial HVAC'],
  'available',
  'full_time'
)
ON CONFLICT (id) DO UPDATE SET
  agency_id = EXCLUDED.agency_id,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  certifications = EXCLUDED.certifications,
  skill_level = EXCLUDED.skill_level,
  specializations = EXCLUDED.specializations,
  availability_status = EXCLUDED.availability_status,
  employment_type = EXCLUDED.employment_type;

-- Insert agency user
INSERT INTO agency_users (
  agency_id, user_id, role, name, email, phone
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'admin',
  'Test User',
  'test@agency.com',
  '9876543210'
)
ON CONFLICT (agency_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Insert test job
INSERT INTO jobs (
  id, job_number, client_name, client_phone, job_type,
  equipment_type, equipment_details, issue_description,
  site_location, assigned_agency_id, required_skill_level,
  scheduled_time, urgency, status, service_fee
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'JOB-2025-0001',
  'Test Client',
  '9876543212',
  'AMC',
  'Industrial Chiller',
  '{"brand": "Test Brand", "model": "TC-1002", "capacity": "100 TR"}'::jsonb,
  'Routine AMC maintenance check',
  '{"address": "Sector 18, Gurgaon", "city": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266}'::jsonb,
  '11111111-1111-1111-1111-111111111111',
  3,
  NOW() + INTERVAL '2 days',
  'normal',
  'assigned',
  5000.00
)
ON CONFLICT (id) DO UPDATE SET
  job_number = EXCLUDED.job_number,
  client_name = EXCLUDED.client_name,
  client_phone = EXCLUDED.client_phone,
  job_type = EXCLUDED.job_type,
  equipment_type = EXCLUDED.equipment_type,
  equipment_details = EXCLUDED.equipment_details,
  issue_description = EXCLUDED.issue_description,
  site_location = EXCLUDED.site_location,
  assigned_agency_id = EXCLUDED.assigned_agency_id,
  required_skill_level = EXCLUDED.required_skill_level,
  scheduled_time = EXCLUDED.scheduled_time,
  urgency = EXCLUDED.urgency,
  status = EXCLUDED.status,
  service_fee = EXCLUDED.service_fee;

-- Create the user account in Supabase Auth
-- Note: This needs to be done through the Supabase Dashboard or API
-- Email: test@agency.com
-- Password: password123

SELECT '✅ Mock data inserted successfully!' as result;