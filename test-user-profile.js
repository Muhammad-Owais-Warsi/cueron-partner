const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing User Profile Fetching...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserProfile() {
  try {
    // First, sign in with one of our test users
    console.log('Signing in with testuser2@example.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'testuser2@example.com',
      password: 'TestPass123',
    });
    
    if (signInError) {
      console.error('Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    
    // Now fetch the user profile from the agency_users table
    console.log('Fetching user profile from database...');
    const { data: agencyUser, error: agencyUserError } = await supabase
      .from('agency_users')
      .select(`
        id,
        role,
        name,
        email,
        is_demo_user,
        agencies (
          id,
          name,
          type,
          partnership_tier
        )
      `)
      .eq('user_id', signInData.user.id)
      .single();
    
    if (agencyUserError) {
      console.error('Error fetching agency user:', agencyUserError.message);
      return;
    }
    
    console.log('✅ User profile fetched successfully!');
    console.log('Profile data:', JSON.stringify(agencyUser, null, 2));
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out');
    
  } catch (error) {
    console.error('User profile test failed:', error.message);
  }
}

testUserProfile();