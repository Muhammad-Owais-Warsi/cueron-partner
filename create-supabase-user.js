const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your environment
const SUPABASE_URL = 'https://dkaqkhfqnmjynkdrnjek.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYXFraGZxbm1qeW5rZHJuamVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc1ODM1OCwiZXhwIjoyMDc5MzM0MzU4fQ.mXGHthDXpnTpMx5Zf8YfUF74MTvBnOirVZ5Rgz5yhjw';

// Create Supabase client with service role key (has full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createSupabaseUser(email, password, userData = {}) {
  try {
    console.log(`Creating user with email: ${email}`);
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        ...userData,
        created_at: new Date().toISOString()
      }
    });

    if (error) {
      throw error;
    }

    console.log('User created successfully:');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('User metadata:', data.user.user_metadata);

    return data.user;
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
}

async function main() {
  // Check if we have the required arguments
  if (process.argv.length < 4) {
    console.log('Usage: node create-supabase-user.js <email> <password> [name] [phone]');
    console.log('Example: node create-supabase-user.js user@example.com password123 "John Doe" "+1234567890"');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || '';
  const phone = process.argv[5] || '';

  try {
    const user = await createSupabaseUser(email, password, {
      name: name,
      phone: phone
    });

    console.log('\n✅ User created successfully in Supabase!');
    console.log('📧 Email:', user.email);
    console.log('🆔 User ID:', user.id);
    console.log('📅 Created at:', user.created_at);
    console.log('\nYou can now use this user to log in to the application.');
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}