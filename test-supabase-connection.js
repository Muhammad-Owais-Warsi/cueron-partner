const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test a simple query to check if we can connect
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('Agency count:', data);
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();