#!/usr/bin/env node

/**
 * Demo User Management Utility Script
 * 
 * This script allows administrators to manage demo user flags in the database.
 * Demo users see generated demo data instead of real database data.
 * 
 * Usage:
 *   node manage-demo-users.js set <user-id>      - Mark user as demo user
 *   node manage-demo-users.js unset <user-id>    - Unmark user as demo user
 *   node manage-demo-users.js list               - List all demo users
 *   node manage-demo-users.js check <user-id>    - Check if user is demo user
 * 
 * Examples:
 *   node manage-demo-users.js set abc123-def456-ghi789
 *   node manage-demo-users.js unset abc123-def456-ghi789
 *   node manage-demo-users.js list
 *   node manage-demo-users.js check abc123-def456-ghi789
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

// Create Supabase client with service role key (has full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Set demo user flag for a user
 */
async function setDemoUser(userId) {
  try {
    console.log(`Setting demo flag for user: ${userId}`);

    const { error } = await supabase
      .from('agency_users')
      .update({ is_demo_user: true })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    console.log('✅ Successfully marked user as demo user');
    console.log('🆔 User ID:', userId);
    console.log('🎭 Demo Status: ENABLED');
  } catch (error) {
    console.error('❌ Error setting demo flag:', error.message);
    throw error;
  }
}

/**
 * Unset demo user flag for a user
 */
async function unsetDemoUser(userId) {
  try {
    console.log(`Unsetting demo flag for user: ${userId}`);

    const { error } = await supabase
      .from('agency_users')
      .update({ is_demo_user: false })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    console.log('✅ Successfully unmarked user as demo user');
    console.log('🆔 User ID:', userId);
    console.log('🎭 Demo Status: DISABLED');
  } catch (error) {
    console.error('❌ Error unsetting demo flag:', error.message);
    throw error;
  }
}

/**
 * List all demo users
 */
async function listDemoUsers() {
  try {
    console.log('Fetching all demo users...\n');

    const { data, error } = await supabase
      .from('agency_users')
      .select('user_id, role, agency_id, agencies(name)')
      .eq('is_demo_user', true);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No demo users found.');
      return;
    }

    console.log(`Found ${data.length} demo user(s):\n`);
    data.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.user_id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Agency ID: ${user.agency_id}`);
      console.log(`   Agency Name: ${user.agencies?.name || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing demo users:', error.message);
    throw error;
  }
}

/**
 * Check if a user is a demo user
 */
async function checkDemoUser(userId) {
  try {
    console.log(`Checking demo status for user: ${userId}\n`);

    const { data, error } = await supabase
      .from('agency_users')
      .select('is_demo_user, role, agency_id, agencies(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      console.log('❌ User not found in agency_users table');
      return;
    }

    console.log('User Information:');
    console.log('🆔 User ID:', userId);
    console.log('👤 Role:', data.role);
    console.log('🏢 Agency ID:', data.agency_id);
    console.log('🏢 Agency Name:', data.agencies?.name || 'N/A');
    console.log('🎭 Demo Status:', data.is_demo_user ? '✅ ENABLED' : '❌ DISABLED');
  } catch (error) {
    console.error('❌ Error checking demo user:', error.message);
    throw error;
  }
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('Demo User Management Utility');
  console.log('');
  console.log('Usage:');
  console.log('  node manage-demo-users.js set <user-id>      - Mark user as demo user');
  console.log('  node manage-demo-users.js unset <user-id>    - Unmark user as demo user');
  console.log('  node manage-demo-users.js list               - List all demo users');
  console.log('  node manage-demo-users.js check <user-id>    - Check if user is demo user');
  console.log('');
  console.log('Examples:');
  console.log('  node manage-demo-users.js set abc123-def456-ghi789');
  console.log('  node manage-demo-users.js unset abc123-def456-ghi789');
  console.log('  node manage-demo-users.js list');
  console.log('  node manage-demo-users.js check abc123-def456-ghi789');
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  const userId = process.argv[3];

  if (!command) {
    showUsage();
    process.exit(1);
  }

  try {
    switch (command.toLowerCase()) {
      case 'set':
        if (!userId) {
          console.error('❌ Error: User ID is required');
          console.log('Usage: node manage-demo-users.js set <user-id>');
          process.exit(1);
        }
        await setDemoUser(userId);
        break;

      case 'unset':
        if (!userId) {
          console.error('❌ Error: User ID is required');
          console.log('Usage: node manage-demo-users.js unset <user-id>');
          process.exit(1);
        }
        await unsetDemoUser(userId);
        break;

      case 'list':
        await listDemoUsers();
        break;

      case 'check':
        if (!userId) {
          console.error('❌ Error: User ID is required');
          console.log('Usage: node manage-demo-users.js check <user-id>');
          process.exit(1);
        }
        await checkDemoUser(userId);
        break;

      default:
        console.error(`❌ Error: Unknown command '${command}'`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
