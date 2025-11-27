console.log('🔧 Setting up Remote Supabase Configuration...\n');

console.log('To use a remote Supabase instance instead of local, follow these steps:\n');

console.log('1. Create a Supabase project:');
console.log('   - Go to https://supabase.com/');
console.log('   - Sign up or log in to your account');
console.log('   - Create a new project\n');

console.log('2. Get your project credentials:');
console.log('   - In your Supabase dashboard, go to Settings → API');
console.log('   - Copy your Project URL and anon key\n');

console.log('3. Update your environment variables in apps/web/.env.local:');
console.log('   - Replace NEXT_PUBLIC_SUPABASE_URL with your project URL');
console.log('   - Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with your anon key');
console.log('   - Add SUPABASE_SERVICE_ROLE_KEY with your service role key\n');

console.log('4. Run the database migrations:');
console.log('   - Copy all files from supabase/migrations/ to your Supabase SQL editor');
console.log('   - Run them in order to set up your database schema\n');

console.log('5. Add seed data:');
console.log('   - Copy the contents of supabase/seed.sql to your Supabase SQL editor');
console.log('   - Run it to add sample data\n');

console.log('Example .env.local configuration for remote Supabase:');
console.log(`
# Supabase (Replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Encryption (Generate a 32-character key)
ENCRYPTION_KEY=your-32-character-encryption-key
`);

console.log('After updating your configuration:');
console.log('- Restart your development server: pnpm dev');
console.log('- Test the connection: node test-supabase-config.js');