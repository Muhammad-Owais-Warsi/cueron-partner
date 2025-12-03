const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Sign Out Functionality...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignOut() {
  try {
    // First, sign in with one of our test users
    console.log('Signing in with testuser@example.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'testuser@example.com',
      password: 'TestPass123',
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('Session exists:', !!signInData.session);
    
    // Now try to sign out
    console.log('Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.warn('Sign out warning (this is expected if session was invalid):', signOutError.message);
    } else {
      console.log('✅ Sign out successful!');
    }
    
    // Verify we're signed out
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session after sign out:', !!session);
    
  } catch (error) {
    console.error('Sign out test failed:', error.message);
  }
}

testSignOut();