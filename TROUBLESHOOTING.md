# Troubleshooting Internal Server Error in Cueron Partner Platform

This guide helps you diagnose and fix the Internal Server Error you're experiencing.

## Common Causes and Solutions

### 1. Supabase Connection Issues

**Problem**: The application is configured to use a local Supabase instance that isn't running.

**Solution**:
1. Install Docker Desktop from https://docs.docker.com/desktop/
2. Start Docker Desktop
3. Run `npx supabase start` in the project root
4. If you get permission errors, run the command as administrator

**Alternative Solution** (Use Remote Supabase):
1. Create a Supabase project at https://supabase.com/
2. Update your `apps/web/.env.local` with your project credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the database migrations from `supabase/migrations/`
4. Add seed data from `supabase/seed.sql`

### 2. Environment Variables Missing

**Problem**: Required environment variables are not set.

**Solution**:
1. Verify `apps/web/.env.local` exists
2. Ensure it contains all required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Other service keys (Google Maps, Razorpay, etc.)

### 3. Database Schema Issues

**Problem**: The database schema doesn't match what the application expects.

**Solution**:
1. If using local Supabase, ensure all migrations have been run:
   ```
   npx supabase migration up
   ```
2. If using remote Supabase, manually run all SQL files from `supabase/migrations/`

### 4. Port Conflicts

**Problem**: Port 3000 is already in use.

**Solution**:
- The application automatically uses port 3001 when 3000 is busy
- Access the application at http://localhost:3001

## Debugging Steps

### 1. Check Terminal Output

Look at the terminal where you ran `pnpm dev` for specific error messages.

### 2. Check Browser Console

Open browser developer tools (F12) and check the Console tab for JavaScript errors.

### 3. Check Network Requests

In browser developer tools, go to the Network tab and look for failed API requests (status 500).

### 4. Test Supabase Connection

Run `node test-supabase-config.js` to verify Supabase connectivity.

### 5. Run Diagnostic Script

Run `node diagnose-internal-error.js` for an automated check of common issues.

## Quick Fixes

### Option 1: Use Mock Data (Development Only)

For development purposes, you can temporarily modify API routes to return mock data:

```typescript
// In any API route file
export async function GET() {
  // Return mock data instead of querying Supabase
  return NextResponse.json({
    data: [
      // ... mock data
    ]
  });
}
```

### Option 2: Check Specific API Routes

If only certain pages are failing:
1. Identify which page is causing the error
2. Check the corresponding API route in `apps/web/src/app/api/`
3. Add console.log statements to trace the error

### Option 3: Enable Detailed Error Logging

Temporarily modify error handling in API routes to show more details:

```typescript
// In API route files, change error responses to include more details
if (error) {
  console.error('Detailed error:', error); // Add this line
  return errorResponse(
    'DATABASE_ERROR',
    process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch data', // Show real error in development
    undefined,
    500
  );
}
```

## Emergency Workaround

If you need to quickly get the application running without Supabase:

1. Create a temporary `.env.local` with mock values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=mock_key
   ```

2. Modify `apps/web/src/lib/supabase/server.ts` to return mock data:
   ```typescript
   export async function createClient() {
     // Return a mock client for development
     return {
       auth: {
         getUser: () => Promise.resolve({ data: { user: null }, error: null }),
         getSession: () => Promise.resolve({ data: { session: null }, error: null })
       },
       from: () => ({
         select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
       })
     };
   }
   ```

## Need More Help?

1. Check the terminal output where you ran `pnpm dev` for specific error messages
2. Look at the browser's Network tab to see which API requests are failing
3. Share the specific error message with your team or in support channels