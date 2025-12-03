const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Authentication...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // Sign up a test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (signUpError) {
      console.error('Sign up failed:', signUpError.message);
      // Continue anyway to test sign in
    } else {
      console.log('✅ Sign up successful!');
      console.log('User ID:', signUpData.user?.id);
    }
    
    // Sign in with the same user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Session expires in:', signInData.session?.expires_in, 'seconds');
    
    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Get user failed:', userError.message);
      return;
    }
    
    console.log('✅ Get user successful!');
    console.log('User email:', userData.user?.email);
    
  } catch (error) {
    console.error('Authentication test failed:', error.message);
  }
}

testAuth();