const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

// This script can work with both local and remote Supabase instances
console.log('Setting up mock data for Cueron Partner Platform...');

// Try to get configuration from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

console.log('Supabase URL:', SUPABASE_URL);

// Check if we have valid configuration
if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.warn('⚠️  Warning: Using default Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your environment.');
  console.log('Instructions:');
  console.log('1. Create a Supabase project at https://supabase.com/');
  console.log('2. Get your project URL and service role key from Settings → API');
  console.log('3. Set these environment variables in apps/web/.env.local:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_project_url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('4. Run this script again');
  process.exit(0);
}

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here') {
  console.warn('⚠️  Warning: Service role key not set. Please set SUPABASE_SERVICE_ROLE_KEY in your environment.');
  console.log('Instructions:');
  console.log('1. Get your service role key from your Supabase project: Settings → API');
  console.log('2. Add this to apps/web/.env.local:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('3. Run this script again');
  process.exit(0);
}

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
    console.log('Testing connection to Supabase...');
    
    // Test connection
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);

    if (error && error.message.includes('Invalid API key')) {
      console.error('❌ Authentication failed. Please check your service role key.');
      process.exit(1);
    }

    if (error && !error.message.includes('relation "agencies" does not exist')) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Connection successful');

    console.log('Adding mock agency...');
    const { error: agencyError } = await supabase
      .from('agencies')
      .upsert(mockAgency, { onConflict: 'id' });

    if (agencyError) {
      console.error('❌ Error adding agency:', agencyError.message);
      // Continue with other data even if this fails
    } else {
      console.log('✅ Agency added successfully');
    }

    console.log('Adding mock engineer...');
    const { error: engineerError } = await supabase
      .from('engineers')
      .upsert(mockEngineer, { onConflict: 'id' });

    if (engineerError) {
      console.error('❌ Error adding engineer:', engineerError.message);
    } else {
      console.log('✅ Engineer added successfully');
    }

    console.log('Adding mock agency user...');
    const { error: userError } = await supabase
      .from('agency_users')
      .upsert(mockAgencyUser, { onConflict: 'agency_id,user_id' });

    if (userError) {
      console.error('❌ Error adding agency user:', userError.message);
    } else {
      console.log('✅ Agency user added successfully');
    }

    console.log('Adding mock job...');
    const { error: jobError } = await supabase
      .from('jobs')
      .upsert(mockJob, { onConflict: 'id' });

    if (jobError) {
      console.error('❌ Error adding job:', jobError.message);
    } else {
      console.log('✅ Job added successfully');
    }

    console.log('\n🎉 Mock data setup process completed!');
    console.log('Next steps:');
    console.log('1. Create a user account with email: test@agency.com');
    console.log('2. Start the web application: cd apps/web && pnpm dev');
    console.log('3. Visit http://localhost:3000 and log in');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addMockData();
}

module.exports = { addMockData, mockAgency, mockEngineer, mockAgencyUser, mockJob };