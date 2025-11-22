-- ============================================================================
-- SEED DATA FOR DEVELOPMENT AND TESTING
-- ============================================================================
-- This file contains sample data for local development and testing
-- DO NOT run this in production!

-- ============================================================================
-- SAMPLE AGENCIES
-- ============================================================================

INSERT INTO agencies (
    id,
    name,
    type,
    registration_number,
    gstn,
    nsdc_code,
    contact_person,
    phone,
    email,
    primary_location,
    service_areas,
    partnership_tier,
    partnership_model,
    engineer_capacity,
    status,
    onboarded_at
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Delhi ITI Center',
    'ITI',
    'ITI-DL-001',
    '07AAACD1234E1Z5',
    'NSDC-ITI-001',
    'Rajesh Kumar',
    '9876543210',
    'rajesh@delhiiti.edu.in',
    '{"city": "New Delhi", "state": "Delhi", "pincode": "110001", "lat": 28.6139, "lng": 77.2090}',
    ARRAY['New Delhi', 'Gurgaon', 'Noida', 'Faridabad'],
    'premium',
    'job_placement',
    50,
    'active',
    NOW() - INTERVAL '6 months'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Mumbai Training Institute',
    'Training',
    'TRN-MH-002',
    '27BBBCD5678F2Z6',
    'NSDC-TRN-002',
    'Priya Sharma',
    '9876543211',
    'priya@mumbaitraining.com',
    '{"city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "lat": 19.0760, "lng": 72.8777}',
    ARRAY['Mumbai', 'Thane', 'Navi Mumbai', 'Pune'],
    'standard',
    'training_placement',
    30,
    'active',
    NOW() - INTERVAL '3 months'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Bangalore Service Vendors',
    'Service',
    'SVC-KA-003',
    '29CCCCD9012G3Z7',
    NULL,
    'Amit Patel',
    '9876543212',
    'amit@bangaloreservice.com',
    '{"city": "Bangalore", "state": "Karnataka", "pincode": "560001", "lat": 12.9716, "lng": 77.5946}',
    ARRAY['Bangalore', 'Mysore', 'Mangalore'],
    'enterprise',
    'dedicated_resource',
    100,
    'active',
    NOW() - INTERVAL '1 year'
);

-- ============================================================================
-- SAMPLE ENGINEERS
-- ============================================================================

INSERT INTO engineers (
    id,
    agency_id,
    name,
    phone,
    email,
    certifications,
    skill_level,
    specializations,
    availability_status,
    current_location,
    employment_type
) VALUES
-- Delhi ITI Engineers
(
    'e1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Vikram Singh',
    '9876543220',
    'vikram@example.com',
    '[{"type": "ITI", "level": 3, "cert_number": "ITI-2020-001", "verified": true}]',
    3,
    ARRAY['Cold Storage', 'Industrial HVAC'],
    'available',
    ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography,
    'full_time'
),
(
    'e2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Rahul Verma',
    '9876543221',
    'rahul@example.com',
    '[{"type": "PMKVY", "level": 4, "cert_number": "PMKVY-2021-002", "verified": true}]',
    4,
    ARRAY['Cold Storage', 'Refrigeration'],
    'available',
    ST_SetSRID(ST_MakePoint(77.2100, 28.6150), 4326)::geography,
    'full_time'
),
-- Mumbai Training Engineers
(
    'e3333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Suresh Patil',
    '9876543222',
    'suresh@example.com',
    '[{"type": "NSDC", "level": 3, "cert_number": "NSDC-2020-003", "verified": true}]',
    3,
    ARRAY['Industrial HVAC', 'Maintenance'],
    'available',
    ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
    'full_time'
),
-- Bangalore Service Engineers
(
    'e4444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Karthik Reddy',
    '9876543223',
    'karthik@example.com',
    '[{"type": "ITI", "level": 5, "cert_number": "ITI-2019-004", "verified": true}]',
    5,
    ARRAY['Cold Storage', 'Industrial HVAC', 'Emergency Repair'],
    'available',
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
    'full_time'
),
(
    'e5555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Deepak Kumar',
    '9876543224',
    'deepak@example.com',
    '[{"type": "PMKVY", "level": 4, "cert_number": "PMKVY-2020-005", "verified": true}]',
    4,
    ARRAY['Refrigeration', 'Maintenance'],
    'on_job',
    ST_SetSRID(ST_MakePoint(77.6000, 12.9800), 4326)::geography,
    'full_time'
);

-- ============================================================================
-- SAMPLE JOBS
-- ============================================================================

INSERT INTO jobs (
    id,
    job_number,
    client_name,
    client_phone,
    job_type,
    equipment_type,
    equipment_details,
    issue_description,
    site_location,
    site_coordinates,
    assigned_agency_id,
    assigned_engineer_id,
    required_skill_level,
    scheduled_time,
    urgency,
    status,
    service_fee
) VALUES
-- Pending job
(
    'j1111111-1111-1111-1111-111111111111',
    'JOB-2025-0001',
    'Delhi Cold Storage Pvt Ltd',
    '9876543230',
    'AMC',
    'Industrial Chiller',
    '{"brand": "Carrier", "model": "30XA-1002", "capacity": "100 TR"}',
    'Routine AMC maintenance check',
    '{"address": "Sector 18, Gurgaon", "city": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266}',
    ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326)::geography,
    '11111111-1111-1111-1111-111111111111',
    NULL,
    3,
    NOW() + INTERVAL '2 days',
    'normal',
    'assigned',
    5000.00
),
-- Assigned job
(
    'j2222222-2222-2222-2222-222222222222',
    'JOB-2025-0002',
    'Mumbai Warehouse Solutions',
    '9876543231',
    'Repair',
    'Cold Room',
    '{"brand": "Blue Star", "model": "CR-500", "capacity": "500 sq ft"}',
    'Temperature not maintaining, possible refrigerant leak',
    '{"address": "Andheri East, Mumbai", "city": "Mumbai", "state": "Maharashtra", "lat": 19.1136, "lng": 72.8697}',
    ST_SetSRID(ST_MakePoint(72.8697, 19.1136), 4326)::geography,
    '22222222-2222-2222-2222-222222222222',
    'e3333333-3333-3333-3333-333333333333',
    3,
    NOW() + INTERVAL '1 day',
    'urgent',
    'accepted',
    8000.00
),
-- In progress job
(
    'j3333333-3333-3333-3333-333333333333',
    'JOB-2025-0003',
    'Bangalore Food Processing',
    '9876543232',
    'Emergency',
    'Blast Freezer',
    '{"brand": "Voltas", "model": "BF-1000", "capacity": "1000 kg/hr"}',
    'Complete system failure, urgent repair needed',
    '{"address": "Electronic City, Bangalore", "city": "Bangalore", "state": "Karnataka", "lat": 12.8456, "lng": 77.6603}',
    ST_SetSRID(ST_MakePoint(77.6603, 12.8456), 4326)::geography,
    '33333333-3333-3333-3333-333333333333',
    'e5555555-5555-5555-5555-555555555555',
    5,
    NOW(),
    'emergency',
    'onsite',
    15000.00
),
-- Completed job
(
    'j4444444-4444-4444-4444-444444444444',
    'JOB-2025-0004',
    'Delhi Pharma Storage',
    '9876543233',
    'Installation',
    'Precision AC',
    '{"brand": "Daikin", "model": "PAC-3000", "capacity": "3 TR"}',
    'New installation for temperature-controlled storage',
    '{"address": "Okhla Industrial Area, Delhi", "city": "New Delhi", "state": "Delhi", "lat": 28.5355, "lng": 77.2732}',
    ST_SetSRID(ST_MakePoint(77.2732, 28.5355), 4326)::geography,
    '11111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    3,
    NOW() - INTERVAL '2 days',
    'normal',
    'completed',
    12000.00
);

-- Update job timestamps for completed job
UPDATE jobs 
SET 
    assigned_at = NOW() - INTERVAL '3 days',
    accepted_at = NOW() - INTERVAL '3 days',
    started_at = NOW() - INTERVAL '2 days',
    completed_at = NOW() - INTERVAL '1 day',
    client_rating = 5,
    client_feedback = 'Excellent service, very professional engineer'
WHERE id = 'j4444444-4444-4444-4444-444444444444';

-- Update job timestamps for in-progress job
UPDATE jobs 
SET 
    assigned_at = NOW() - INTERVAL '4 hours',
    accepted_at = NOW() - INTERVAL '3 hours',
    started_at = NOW() - INTERVAL '1 hour'
WHERE id = 'j3333333-3333-3333-3333-333333333333';

-- Update job timestamps for accepted job
UPDATE jobs 
SET 
    assigned_at = NOW() - INTERVAL '6 hours',
    accepted_at = NOW() - INTERVAL '5 hours'
WHERE id = 'j2222222-2222-2222-2222-222222222222';

-- Update job timestamps for assigned job
UPDATE jobs 
SET 
    assigned_at = NOW() - INTERVAL '1 hour'
WHERE id = 'j1111111-1111-1111-1111-111111111111';

-- ============================================================================
-- SAMPLE AGENCY USERS
-- ============================================================================

-- Note: user_id should match Supabase Auth user IDs
-- For testing, using placeholder UUIDs
INSERT INTO agency_users (
    agency_id,
    user_id,
    role,
    name,
    email,
    phone
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'u1111111-1111-1111-1111-111111111111',
    'admin',
    'Rajesh Kumar',
    'rajesh@delhiiti.edu.in',
    '9876543210'
),
(
    '22222222-2222-2222-2222-222222222222',
    'u2222222-2222-2222-2222-222222222222',
    'admin',
    'Priya Sharma',
    'priya@mumbaitraining.com',
    '9876543211'
),
(
    '33333333-3333-3333-3333-333333333333',
    'u3333333-3333-3333-3333-333333333333',
    'admin',
    'Amit Patel',
    'amit@bangaloreservice.com',
    '9876543212'
),
(
    '33333333-3333-3333-3333-333333333333',
    'u4444444-4444-4444-4444-444444444444',
    'manager',
    'Sneha Reddy',
    'sneha@bangaloreservice.com',
    '9876543213'
);

-- ============================================================================
-- SAMPLE PAYMENTS
-- ============================================================================

INSERT INTO payments (
    agency_id,
    job_id,
    amount,
    payment_type,
    status,
    invoice_number,
    invoice_date
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'j4444444-4444-4444-4444-444444444444',
    12000.00,
    'job_payment',
    'paid',
    'INV-2025-0001',
    CURRENT_DATE - INTERVAL '1 day'
),
(
    '33333333-3333-3333-3333-333333333333',
    'j3333333-3333-3333-3333-333333333333',
    15000.00,
    'job_payment',
    'pending',
    NULL,
    NULL
);

-- Update paid payment
UPDATE payments 
SET paid_at = NOW() - INTERVAL '12 hours'
WHERE invoice_number = 'INV-2025-0001';

-- ============================================================================
-- SAMPLE NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (
    user_id,
    agency_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id
) VALUES
(
    'u1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'New Job Assigned',
    'Job JOB-2025-0001 has been assigned to your agency',
    'job_assignment',
    'job',
    'j1111111-1111-1111-1111-111111111111'
),
(
    'u3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Job Completed',
    'Engineer Deepak Kumar completed job JOB-2025-0003',
    'job_completion',
    'job',
    'j3333333-3333-3333-3333-333333333333'
);

-- ============================================================================
-- REFRESH MATERIALIZED VIEWS
-- ============================================================================

REFRESH MATERIALIZED VIEW agency_monthly_metrics;
REFRESH MATERIALIZED VIEW engineer_performance_metrics;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data was inserted
DO $$
BEGIN
    RAISE NOTICE 'Agencies: %', (SELECT COUNT(*) FROM agencies);
    RAISE NOTICE 'Engineers: %', (SELECT COUNT(*) FROM engineers);
    RAISE NOTICE 'Jobs: %', (SELECT COUNT(*) FROM jobs);
    RAISE NOTICE 'Payments: %', (SELECT COUNT(*) FROM payments);
    RAISE NOTICE 'Agency Users: %', (SELECT COUNT(*) FROM agency_users);
    RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
END $$;
