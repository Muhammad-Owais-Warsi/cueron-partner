# Setting Up Mock Data for Cueron Partner Platform

This guide explains how to set up mock data for development and testing purposes.

## Prerequisites

1. Docker Desktop (required for running Supabase locally)
2. Node.js and pnpm
3. Supabase CLI

## Installation Steps

### 1. Install Docker Desktop

Download and install Docker Desktop from: https://docs.docker.com/desktop/

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Start Supabase Local Instance

```bash
cd d:\vendor
npx supabase start
```

### 4. Create Mock User Account

Once Supabase is running, create a mock user account:

```bash
node create-mock-user-account.js
```

This will create a user with:
- Email: test@agency.com
- Password: password123

### 5. Add Mock Data

Add mock data to populate the dashboard:

```bash
node add-mock-data.js
```

This will add:
- A test agency
- A test engineer
- A test job
- Associated agency user

## Manual Database Setup (Alternative)

If you prefer to set up the data manually, you can use the SQL commands below:

```sql
-- Insert test agency
INSERT INTO agencies (
  id, name, type, registration_number, gstn, nsdc_code, 
  contact_person, phone, email, primary_location, service_areas,
  partnership_tier, partnership_model, engineer_capacity, status, onboarded_at
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Test Agency',
  'Service',
  'TEST-001',
  '07AAACD1234E1Z6',
  'NSDC-TEST-001',
  'Test User',
  '9876543210',
  'test@agency.com',
  '{"city": "New Delhi", "state": "Delhi", "pincode": "110001", "lat": 28.6139, "lng": 77.2090}',
  ARRAY['New Delhi', 'Gurgaon', 'Noida'],
  'premium',
  'dedicated_resource',
  10,
  'active',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- Insert test engineer
INSERT INTO engineers (
  id, agency_id, name, phone, email, certifications,
  skill_level, specializations, availability_status, employment_type
) VALUES (
  'e1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Test Engineer',
  '9876543211',
  'engineer@test.com',
  '[{"type": "ITI", "level": 3, "cert_number": "ITI-2020-001", "verified": true}]',
  3,
  ARRAY['Cold Storage', 'Industrial HVAC'],
  'available',
  'full_time'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- Insert agency user
INSERT INTO agency_users (
  agency_id, user_id, role, name, email, phone
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'u1111111-1111-1111-1111-111111111111',
  'admin',
  'Test User',
  'test@agency.com',
  '9876543210'
)
ON CONFLICT (agency_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Insert test job
INSERT INTO jobs (
  id, job_number, client_name, client_phone, job_type,
  equipment_type, equipment_details, issue_description,
  site_location, assigned_agency_id, required_skill_level,
  scheduled_time, urgency, status, service_fee
) VALUES (
  'j1111111-1111-1111-1111-111111111111',
  'JOB-2025-0001',
  'Test Client',
  '9876543212',
  'AMC',
  'Industrial Chiller',
  '{"brand": "Test Brand", "model": "TC-1002", "capacity": "100 TR"}',
  'Routine AMC maintenance check',
  '{"address": "Sector 18, Gurgaon", "city": "Gurgaon", "state": "Haryana", "lat": 28.4595, "lng": 77.0266}',
  'a1111111-1111-1111-1111-111111111111',
  3,
  NOW() + INTERVAL '2 days',
  'normal',
  'assigned',
  5000.00
)
ON CONFLICT (id) DO UPDATE SET
  job_number = EXCLUDED.job_number;
```

## Accessing the Dashboard

Once the setup is complete:

1. Start the web application:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Open your browser to http://localhost:3000

3. Log in with:
   - Email: test@agency.com
   - Password: password123

You should now see mock data populated in the dashboard.