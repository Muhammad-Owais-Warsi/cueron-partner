const { Client } = require('pg');
require('dotenv').config({ path: './apps/web/.env.local' });

// Database configuration for local Supabase
const dbConfig = {
  host: 'localhost',
  port: 54322, // Default Supabase DB port
  database: 'postgres',
  user: 'postgres',
  password: 'postgres', // Default Supabase password
};

// Create a new client
const client = new Client(dbConfig);

// Mock data for a test agency
const mockAgency = {
  id: 'a1111111-1111-1111-1111-111111111111',
  name: 'Test Agency',
  type: 'Service',
  registration_number: 'TEST-001',
  gstn: '07AAACD1234E1Z6',
  nsdc_code: 'NSDC-TEST-001',
  contact_person: 'Test User',
  phone: '9876543210',
  email: 'test@agency.com',
  primary_location: JSON.stringify({
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    lat: 28.6139,
    lng: 77.2090
  }),
  service_areas: '{New Delhi,Gurgaon,Noida}',
  partnership_tier: 'premium',
  partnership_model: 'dedicated_resource',
  engineer_capacity: 10,
  status: 'active',
  onboarded_at: new Date().toISOString()
};

// Mock data for a test engineer
const mockEngineer = {
  id: 'e1111111-1111-1111-1111-111111111111',
  agency_id: 'a1111111-1111-1111-1111-111111111111',
  name: 'Test Engineer',
  phone: '9876543211',
  email: 'engineer@test.com',
  certifications: JSON.stringify([
    {
      type: 'ITI',
      level: 3,
      cert_number: 'ITI-2020-001',
      verified: true
    }
  ]),
  skill_level: 3,
  specializations: '{Cold Storage,Industrial HVAC}',
  availability_status: 'available',
  employment_type: 'full_time'
};

// Mock data for a test agency user
const mockAgencyUser = {
  agency_id: 'a1111111-1111-1111-1111-111111111111',
  user_id: 'u1111111-1111-1111-1111-111111111111',
  role: 'admin',
  name: 'Test User',
  email: 'test@agency.com',
  phone: '9876543210'
};

// Mock data for a test job
const mockJob = {
  id: 'j1111111-1111-1111-1111-111111111111',
  job_number: 'JOB-2025-0001',
  client_name: 'Test Client',
  client_phone: '9876543212',
  job_type: 'AMC',
  equipment_type: 'Industrial Chiller',
  equipment_details: JSON.stringify({
    brand: 'Test Brand',
    model: 'TC-1002',
    capacity: '100 TR'
  }),
  issue_description: 'Routine AMC maintenance check',
  site_location: JSON.stringify({
    address: 'Sector 18, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    lat: 28.4595,
    lng: 77.0266
  }),
  assigned_agency_id: 'a1111111-1111-1111-1111-111111111111',
  required_skill_level: 3,
  scheduled_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  urgency: 'normal',
  status: 'assigned',
  service_fee: 5000.00
};

async function insertMockData() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Insert agency
    console.log('Inserting mock agency...');
    const agencyQuery = `
      INSERT INTO agencies (
        id, name, type, registration_number, gstn, nsdc_code, 
        contact_person, phone, email, primary_location, service_areas,
        partnership_tier, partnership_model, engineer_capacity, status, onboarded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16
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
        onboarded_at = EXCLUDED.onboarded_at
    `;
    
    await client.query(agencyQuery, [
      mockAgency.id, mockAgency.name, mockAgency.type, mockAgency.registration_number,
      mockAgency.gstn, mockAgency.nsdc_code, mockAgency.contact_person, mockAgency.phone,
      mockAgency.email, mockAgency.primary_location, mockAgency.service_areas,
      mockAgency.partnership_tier, mockAgency.partnership_model, mockAgency.engineer_capacity,
      mockAgency.status, mockAgency.onboarded_at
    ]);
    console.log('✅ Agency inserted successfully');

    // Insert engineer
    console.log('Inserting mock engineer...');
    const engineerQuery = `
      INSERT INTO engineers (
        id, agency_id, name, phone, email, certifications,
        skill_level, specializations, availability_status, employment_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10
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
        employment_type = EXCLUDED.employment_type
    `;
    
    await client.query(engineerQuery, [
      mockEngineer.id, mockEngineer.agency_id, mockEngineer.name, mockEngineer.phone,
      mockEngineer.email, mockEngineer.certifications, mockEngineer.skill_level,
      mockEngineer.specializations, mockEngineer.availability_status, mockEngineer.employment_type
    ]);
    console.log('✅ Engineer inserted successfully');

    // Insert agency user
    console.log('Inserting mock agency user...');
    const userQuery = `
      INSERT INTO agency_users (
        agency_id, user_id, role, name, email, phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      ON CONFLICT (agency_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone
    `;
    
    await client.query(userQuery, [
      mockAgencyUser.agency_id, mockAgencyUser.user_id, mockAgencyUser.role,
      mockAgencyUser.name, mockAgencyUser.email, mockAgencyUser.phone
    ]);
    console.log('✅ Agency user inserted successfully');

    // Insert job
    console.log('Inserting mock job...');
    const jobQuery = `
      INSERT INTO jobs (
        id, job_number, client_name, client_phone, job_type,
        equipment_type, equipment_details, issue_description,
        site_location, assigned_agency_id, required_skill_level,
        scheduled_time, urgency, status, service_fee
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10, $11, $12, $13, $14, $15
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
        service_fee = EXCLUDED.service_fee
    `;
    
    await client.query(jobQuery, [
      mockJob.id, mockJob.job_number, mockJob.client_name, mockJob.client_phone,
      mockJob.job_type, mockJob.equipment_type, mockJob.equipment_details,
      mockJob.issue_description, mockJob.site_location, mockJob.assigned_agency_id,
      mockJob.required_skill_level, mockJob.scheduled_time, mockJob.urgency,
      mockJob.status, mockJob.service_fee
    ]);
    console.log('✅ Job inserted successfully');

    console.log('\n🎉 All mock data inserted successfully!');
    console.log('You can now log in with the following credentials:');
    console.log('- Email: test@agency.com');
    console.log('- Password: password123');
    console.log('(Note: You still need to create the actual user account in Supabase Auth)');

  } catch (error) {
    console.error('❌ Error inserting mock data:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  insertMockData();
}

module.exports = { insertMockData };