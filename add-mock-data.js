const { createClient } = require('@supabase/supabase-js');

// Supabase configuration for local development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Validate configuration
if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  process.exit(1);
}

console.log('Using Supabase URL:', SUPABASE_URL);
console.log('Using Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` : 'NOT SET');

// Create Supabase client with service role key (has full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
  primary_location: {
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    lat: 28.6139,
    lng: 77.2090
  },
  service_areas: ['New Delhi', 'Gurgaon', 'Noida'],
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
  certifications: [
    {
      type: 'ITI',
      level: 3,
      cert_number: 'ITI-2020-001',
      verified: true
    }
  ],
  skill_level: 3,
  specializations: ['Cold Storage', 'Industrial HVAC'],
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
  equipment_details: {
    brand: 'Test Brand',
    model: 'TC-1002',
    capacity: '100 TR'
  },
  issue_description: 'Routine AMC maintenance check',
  site_location: {
    address: 'Sector 18, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    lat: 28.4595,
    lng: 77.0266
  },
  assigned_agency_id: 'a1111111-1111-1111-1111-111111111111',
  required_skill_level: 3,
  scheduled_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  urgency: 'normal',
  status: 'assigned',
  service_fee: 5000.00
};

async function addMockData() {
  try {
    console.log('Adding mock agency...');
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .upsert(mockAgency, { onConflict: 'id' });

    if (agencyError) {
      throw new Error(`Error adding agency: ${agencyError.message}`);
    }
    console.log('✅ Agency added successfully');

    console.log('Adding mock engineer...');
    const { data: engineerData, error: engineerError } = await supabase
      .from('engineers')
      .upsert(mockEngineer, { onConflict: 'id' });

    if (engineerError) {
      throw new Error(`Error adding engineer: ${engineerError.message}`);
    }
    console.log('✅ Engineer added successfully');

    console.log('Adding mock agency user...');
    const { data: userData, error: userError } = await supabase
      .from('agency_users')
      .upsert(mockAgencyUser, { onConflict: 'agency_id,user_id' });

    if (userError) {
      throw new Error(`Error adding agency user: ${userError.message}`);
    }
    console.log('✅ Agency user added successfully');

    console.log('Adding mock job...');
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .upsert(mockJob, { onConflict: 'id' });

    if (jobError) {
      throw new Error(`Error adding job: ${jobError.message}`);
    }
    console.log('✅ Job added successfully');

    console.log('\n🎉 All mock data added successfully!');
    console.log('You can now log in with the following credentials:');
    console.log('- Email: test@agency.com');
    console.log('- Password: (you will need to create a user account separately)');
    
  } catch (error) {
    console.error('❌ Error adding mock data:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addMockData();
}

module.exports = { addMockData, mockAgency, mockEngineer, mockAgencyUser, mockJob };