const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkaqkhfqnmjynkdrnjek.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

// Validate configuration
if (!SUPABASE_URL || SUPABASE_URL === 'https://dkaqkhfqnmjynkdrnjek.supabase.co') {
  console.warn('Warning: Using default Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL in your environment.');
}

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here') {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set. Please set it in your environment.');
  console.error('Get it from your Supabase dashboard: Settings → API → service_role secret key');
  process.exit(1);
}

// Create Supabase client with service role key (has full access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createUser(email, password, userData = {}) {
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
    console.log('Usage: node create-user.js <email> <password> [name] [phone]');
    console.log('Example: node create-user.js user@example.com password123 "John Doe" "+1234567890"');
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || '';
  const phone = process.argv[5] || '';

  try {
    const user = await createUser(email, password, {
      name: name,
      phone: phone
    });

    console.log('\n✅ User created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🆔 User ID:', user.id);
    console.log('📅 Created at:', user.created_at);
  } catch (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}