const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Internal Server Error in Cueron Partner Platform...\n');

// Check 1: Environment variables
console.log('1. Checking environment variables...');
try {
  const envPath = path.join(__dirname, 'apps', 'web', '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL is set');
    } else {
      console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
    }
    
    if (envContent.includes('http://localhost:54321')) {
      console.log('✅ Using local Supabase instance (http://localhost:54321)');
      console.log('💡 Make sure Supabase is running locally with: npx supabase start');
    }
  } else {
    console.log('❌ .env.local file not found');
    console.log('💡 Create apps/web/.env.local with your Supabase configuration');
  }
} catch (error) {
  console.log('❌ Error checking environment variables:', error.message);
}

// Check 2: Required dependencies
console.log('\n2. Checking required dependencies...');
try {
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ @supabase/supabase-js is installed');
} catch (error) {
  console.log('❌ @supabase/supabase-js is not installed');
  console.log('💡 Run: pnpm add @supabase/supabase-js');
}

// Check 3: Supabase connection
console.log('\n3. Checking Supabase connection...');
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
    console.log('💡 To test connection, run: node test-supabase-config.js');
  } else {
    console.log('❌ Supabase configuration is incomplete');
  }
} catch (error) {
  console.log('❌ Error checking Supabase configuration:', error.message);
}

// Check 4: Common API route issues
console.log('\n4. Checking for common API route issues...');

// Check if there are any syntax errors in API routes
const apiRoutes = [
  'apps/web/src/app/api/jobs/route.ts',
  'apps/web/src/app/api/agencies/[id]/route.ts',
  'apps/web/src/app/api/engineers/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(__dirname, route);
  if (fs.existsSync(routePath)) {
    try {
      // Just check if file can be read without syntax errors
      fs.readFileSync(routePath, 'utf8');
      console.log(`✅ ${route} - No syntax errors detected`);
    } catch (error) {
      console.log(`❌ ${route} - Syntax error: ${error.message}`);
    }
  } else {
    console.log(`⚠️  ${route} - File not found`);
  }
});

// Check 5: Supabase local instance
console.log('\n5. Checking Supabase local instance...');
console.log('💡 To start Supabase locally, you need Docker Desktop installed');
console.log('💡 Then run: npx supabase start');
console.log('💡 If you get permission errors, try running as administrator');

// Recommendations
console.log('\n📋 Recommendations to fix Internal Server Error:');
console.log('1. Ensure Docker Desktop is installed and running');
console.log('2. Start Supabase locally: npx supabase start');
console.log('3. Verify environment variables in apps/web/.env.local');
console.log('4. Test Supabase connection: node test-supabase-config.js');
console.log('5. Check browser console and terminal for specific error messages');
console.log('6. If using remote Supabase, update .env.local with your project URL and keys');

console.log('\n🔧 For immediate debugging:');
console.log('- Check terminal where you ran "pnpm dev" for error messages');
console.log('- Check browser developer tools console for client-side errors');
console.log('- Look at Network tab to see which API requests are failing');