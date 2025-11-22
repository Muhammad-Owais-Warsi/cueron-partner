# Supabase Migration Guide - Quick Setup

Your Supabase credentials are already configured in `apps/web/.env.local`:
- **Project URL**: https://dkaqkhfqnmjynkdrnjek.supabase.co
- **Anon Key**: Configured ✅

## Step-by-Step Migration Instructions

### 1. Access Your Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **dkaqkhfqnmjynkdrnjek**

### 2. Enable PostGIS Extension

1. In the left sidebar, click **Database** → **Extensions**
2. Search for **"postgis"**
3. Click **Enable** next to PostGIS
4. Wait for confirmation (takes ~30 seconds)

### 3. Run Migrations in Order

Go to **SQL Editor** in the left sidebar, then for each migration file below:

#### Migration 1: Initial Schema
1. Click **"New Query"**
2. Open file: `supabase/migrations/00001_initial_schema.sql`
3. Copy ALL contents and paste into the SQL Editor
4. Click **"Run"** (bottom right)
5. Wait for success message: "Success. No rows returned"

#### Migration 2: RLS Policies
1. Click **"New Query"** again
2. Open file: `supabase/migrations/00002_rls_policies.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

#### Migration 3: Analytics Views
1. Click **"New Query"**
2. Open file: `supabase/migrations/00003_analytics_views.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

#### Migration 4: Storage Setup
1. Click **"New Query"**
2. Open file: `supabase/migrations/00004_storage_setup.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

#### Migration 5: Realtime Setup
1. Click **"New Query"**
2. Open file: `supabase/migrations/00005_realtime_setup.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

#### Migration 6: Job Spatial Filtering
1. Click **"New Query"**
2. Open file: `supabase/migrations/00006_job_spatial_filtering.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

#### Migration 7: Notification Preferences
1. Click **"New Query"**
2. Open file: `supabase/migrations/00007_notification_preferences.sql`
3. Copy ALL contents and paste
4. Click **"Run"**
5. Wait for success

### 4. Verify Tables Created

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ agencies
   - ✅ engineers
   - ✅ jobs
   - ✅ job_status_history
   - ✅ payments
   - ✅ agency_users
   - ✅ notifications
   - ✅ fcm_tokens

### 5. Verify Storage Buckets

1. Go to **Storage** in the left sidebar
2. You should see these buckets:
   - ✅ engineer-photos
   - ✅ job-photos
   - ✅ signatures
   - ✅ documents
   - ✅ invoices

### 6. Configure Phone Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. For development, you can use Supabase's test OTP:
   - Any phone number will work
   - OTP will be shown in the console
4. For production, configure Twilio or MSG91

### 7. Test the Connection

Your web app is already running at http://localhost:3000

1. Open http://localhost:3000 in your browser
2. Try to access the login page
3. Check browser console for any Supabase errors

## Quick Verification SQL

Run this in SQL Editor to verify everything is set up:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check PostGIS
SELECT PostGIS_Version();

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

## Troubleshooting

### Error: "PostGIS extension not found"
**Solution**: Go to Database → Extensions and enable PostGIS

### Error: "Permission denied"
**Solution**: Make sure you're running the queries in the SQL Editor (not as a regular user)

### Error: "Relation already exists"
**Solution**: The migration was already run. Skip to the next one.

### Storage buckets not showing
**Solution**: Re-run migration 00004_storage_setup.sql

## Next Steps

After migrations are complete:

1. ✅ Database schema is ready
2. ✅ RLS policies are active
3. ✅ Storage buckets are configured
4. ✅ Real-time is enabled
5. ➡️ Your app at http://localhost:3000 should now work with Supabase!

## Optional: Add Test Data

If you want to test with sample data, run the seed file:

1. Go to **SQL Editor**
2. Open `supabase/seed.sql`
3. Copy and paste contents
4. Click **"Run"**

This will create:
- 3 sample agencies
- 5 sample engineers
- 4 sample jobs
- Sample payments and notifications

---

**Need Help?** Check the Supabase documentation at https://supabase.com/docs
