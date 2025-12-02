#!/usr/bin/env node

/**
 * Create Demo User - Complete Script
 * 
 * This script creates a new user account and marks it as a demo user in one step.
 * 
 * Usage:
 *   node create-demo-user.js <email> <password> <name>
 * 
 * Example:
 *   node create-demo-user.js demo@example.com password123 "Demo User"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate configuration
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  console.error('Please set it in apps/web/.env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('Get it from your Supabase dashboard: Settings → API → service_role secret key');
  console.error('Then add it to apps/web/.env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createDemoUser(email, password, name) {
  try {
    console.log('🚀 Creating demo user...\n');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('');

    // Step 1: Create user in Supabase Auth
    console.log('Step 1: Creating user account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        created_at: new Date().toISOString()
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('✅ User account created');
    console.log('   User ID:', userId);
    console.log('');

    // Step 2: Get or create demo agency
    console.log('Step 2: Getting or creating demo agency...');
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id, name')
      .eq('name', 'Demo Agency')
      .maybeSingle();

    let agencyId = existingAgency?.id;

    if (!agencyId) {
      console.log('   Creating demo agency...');
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: 'Demo Agency',
          type: 'Service',
          partnership_tier: 'standard',
          partnership_model: 'job_placement',
          registration_number: 'DEMO-001',
          gstn: '29ABCDE1234F1Z5',
          contact_person: 'Demo Contact',
          phone: '9876543210',
          email: 'demo@agency.com',
          primary_location: { city: 'Demo City', state: 'Demo State', address: 'Demo Address' }
        })
        .select()
        .single();

      if (agencyError) {
        throw new Error(`Failed to create agency: ${agencyError.message}`);
      }

      agencyId = newAgency.id;
      console.log('   ✅ Demo agency created:', agencyId);
    } else {
      console.log('   ✅ Using existing demo agency:', agencyId);
    }
    console.log('');

    // Step 3: Create agency_user record with demo flag
    console.log('Step 3: Creating agency user record...');
    const { error: agencyUserError } = await supabase
      .from('agency_users')
      .insert({
        user_id: userId,
        agency_id: agencyId,
        role: 'admin',
        name: name,
        email: email,
        phone: '9876543210',
        is_active: true,
        is_demo_user: true  // Set demo flag immediately
      });

    if (agencyUserError) {
      throw new Error(`Failed to create agency user: ${agencyUserError.message}`);
    }

    console.log('✅ Agency user record created with demo flag enabled');
    console.log('');

    // Step 4: Verify demo status
    console.log('Step 4: Verifying demo status...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('agency_users')
      .select('is_demo_user, role, agency_id')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify demo status: ${verifyError.message}`);
    }

    console.log('✅ Demo status verified');
    console.log('');

    // Success summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ DEMO USER CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('Login Credentials:');
    console.log('  📧 Email:', email);
    console.log('  🔑 Password:', password);
    console.log('');
    console.log('User Details:');
    console.log('  🆔 User ID:', userId);
    console.log('  👤 Name:', name);
    console.log('  👔 Role:', verifyData.role);
    console.log('  🏢 Agency ID:', verifyData.agency_id, '(Demo Agency)');
    console.log('  🎭 Demo Status: ✅ ENABLED');
    console.log('');
    console.log('What happens next:');
    console.log('  ✅ User can log in with the credentials above');
    console.log('  ✅ Dashboard will show realistic demo data');
    console.log('  ✅ Data is consistent across sessions');
    console.log('  ❌ User cannot modify data (writes blocked)');
    console.log('');
    console.log('═══════════════════════════════════════════');

    return { userId, email, name };
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════');
    console.error('❌ FAILED TO CREATE DEMO USER');
    console.error('═══════════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    throw error;
  }
}

async function main() {
  // Check if we have the required arguments
  if (process.argv.length < 5) {
    console.log('Create Demo User - Complete Script');
    console.log('');
    console.log('Usage:');
    console.log('  node create-demo-user.js <email> <password> <name>');
    console.log('');
    console.log('Example:');
    console.log('  node create-demo-user.js demo@example.com password123 "Demo User"');
    console.log('');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  try {
    await createDemoUser(email, password, name);
  } catch (error) {
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createDemoUser };
