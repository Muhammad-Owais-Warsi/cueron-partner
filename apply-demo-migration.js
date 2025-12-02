#!/usr/bin/env node

/**
 * Apply Demo User Migration
 * 
 * This script applies the is_demo_user column migration to your Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: 'apps/web/.env.local' });

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate configuration
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Applying demo user migration...\n');

    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/00009_add_demo_user_flag.sql', 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Execute the migration
    console.log('⚙️  Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try alternative method - direct query
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      const statements = [
        `ALTER TABLE agency_users ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT FALSE NOT NULL;`,
        `CREATE INDEX IF NOT EXISTS idx_agency_users_demo ON agency_users(is_demo_user) WHERE is_demo_user = TRUE;`,
        `COMMENT ON COLUMN agency_users.is_demo_user IS 'Flag indicating if this user is a demo/mock user. Demo users see generated demo data instead of real database data.';`
      ];

      for (const statement of statements) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
        if (stmtError) {
          console.error(`   ❌ Failed: ${stmtError.message}`);
        } else {
          console.log(`   ✅ Success`);
        }
      }
    }

    // Verify the column exists
    console.log('');
    console.log('🔍 Verifying migration...');
    const { data, error: verifyError } = await supabase
      .from('agency_users')
      .select('is_demo_user')
      .limit(1);

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('The is_demo_user column has been added to agency_users table.');
    console.log('You can now create demo users with:');
    console.log('');
    console.log('  node create-demo-user.js demo@example.com password123 "Demo User"');
    console.log('');
    console.log('Or mark existing users as demo users with:');
    console.log('');
    console.log('  node manage-demo-users.js set <user-id>');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════');
    console.error('❌ MIGRATION FAILED');
    console.error('═══════════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Please apply the migration manually via Supabase Dashboard:');
    console.error('1. Go to your Supabase project dashboard');
    console.error('2. Click SQL Editor');
    console.error('3. Run the SQL from: supabase/migrations/00009_add_demo_user_flag.sql');
    console.error('');
    process.exit(1);
  }
}

applyMigration();
