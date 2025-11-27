require('dotenv').config({ path: './apps/web/.env.local' });

console.log(`
==========================================
SUPABASE CREDENTIALS SETUP GUIDE
==========================================

To fix the "Invalid API key" error, you need to get the correct credentials from your Supabase dashboard:

1. GO TO YOUR SUPABASE DASHBOARD
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project

2. GET YOUR PROJECT URL
   - In the left sidebar, click "Settings" (gear icon)
   - Click "API" in the settings menu
   - Copy the "Project URL" (should look like: https://xxxxx.supabase.co)

3. GET YOUR ANON KEY
   - In the same "API" page, find the "Project API keys" section
   - Copy the "anon" public key (not the service_role key)

4. UPDATE YOUR ENVIRONMENT VARIABLES
   - Open apps/web/.env.local
   - Update NEXT_PUBLIC_SUPABASE_URL with your Project URL
   - Update NEXT_PUBLIC_SUPABASE_ANON_KEY with your anon key
   - Save the file

5. RESTART YOUR DEVELOPMENT SERVER
   - Stop the current server (Ctrl+C)
   - Run: pnpm dev

==========================================
TROUBLESHOOTING TIPS
==========================================

If you continue to have issues:

1. Check that your keys don't have extra spaces
2. Make sure you're using the "anon" key, not the "service_role" key for the client
3. Verify that your Supabase project is active and not paused
4. Check that you haven't exceeded any usage limits

==========================================
CURRENT CONFIGURATION
==========================================

Project URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'NOT SET'}

`);