#!/usr/bin/env node

/**
 * Fix Existing User - Add to agency_users table
 * 
 * This script adds an existing auth user to the agency_users table
 * and marks them as a demo user.
 * 
 * Usage:
 *   node fix-existing-user.js <user-id>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Supabase credentials not set in apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixExistingUser(userId) {
  try {
    console.log('🔧 Fixing existing user...\n');
    console.log('🆔 User ID:', userId);
    console.log('');

    // Step 1: Verify user exists in auth
    console.log('Step 1: Checking if user exists in auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      throw new Error(`User not found in auth: ${authError?.message || 'Unknown error'}`);
    }

    console.log('✅ User found in auth');
    console.log('   Email:', authUser.user.email);
    console.log('');

    // Step 2: Check if user already exists in agency_users
    console.log('Step 2: Checking agency_users table...');
    const { data: existingAgencyUser } = await supabase
      .from('agency_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAgencyUser) {
      console.log('⚠️  User already exists in agency_users');
      console.log('   Updating demo flag...');
      
      const { error: updateError } = await supabase
        .from('agency_users')
        .update({ is_demo_user: true })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update demo flag: ${updateError.message}`);
      }

      console.log('✅ Demo flag updated');
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('✅ USER FIXED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════');
      console.log('');
      console.log('User Details:');
      console.log('  🆔 User ID:', userId);
      console.log('  📧 Email:', authUser.user.email);
      console.log('  🎭 Demo Status: ✅ ENABLED');
      console.log('');
      return;
    }

    // Step 3: Get or create a demo agency
    console.log('Step 3: Getting or creating demo agency...');
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

    // Step 4: Create agency_user record with demo flag
    console.log('Step 4: Creating agency_user record...');
    const { error: insertError } = await supabase
      .from('agency_users')
      .insert({
        user_id: userId,
        agency_id: agencyId,
        role: 'admin',
        name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Demo User',
        email: authUser.user.email,
        phone: authUser.user.user_metadata?.phone || '9876543210',
        is_active: true,
        is_demo_user: true
      });

    if (insertError) {
      throw new Error(`Failed to create agency_user: ${insertError.message}`);
    }

    console.log('✅ Agency user record created with demo flag enabled');
    console.log('');

    // Success
    console.log('═══════════════════════════════════════════');
    console.log('✅ USER FIXED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('User Details:');
    console.log('  🆔 User ID:', userId);
    console.log('  📧 Email:', authUser.user.email);
    console.log('  👔 Role: admin');
    console.log('  🏢 Agency ID:', agencyId, '(Demo Agency)');
    console.log('  🎭 Demo Status: ✅ ENABLED');
    console.log('');
    console.log('The user can now log in and will see demo data!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════');
    console.error('❌ FAILED TO FIX USER');
    console.error('═══════════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log('Fix Existing User - Add to agency_users table');
    console.log('');
    console.log('Usage:');
    console.log('  node fix-existing-user.js <user-id>');
    console.log('');
    console.log('Example:');
    console.log('  node fix-existing-user.js dea85246-480e-430b-a798-925aabfcd3f1');
    console.log('');
    process.exit(1);
  }

  const userId = process.argv[2];
  await fixExistingUser(userId);
}

main();
