const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

// Test Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkaqkhfqnmjynkdrnjek.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('Testing Supabase configuration...');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 10)}...` : 'NOT SET');

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test the configuration by trying to get the schema
async function testSupabaseConnection() {
  try {
    console.log('\nTesting connection...');
    
    // Try to get a simple query to test the connection
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection test successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed with exception:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase configuration is working correctly!');
  } else {
    console.log('\n❌ Supabase configuration has issues.');
    console.log('Please check your environment variables and Supabase project settings.');
  }
});