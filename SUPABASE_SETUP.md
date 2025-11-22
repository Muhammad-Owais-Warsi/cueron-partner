# Supabase Backend Setup - Complete Guide

This guide walks you through setting up the complete Supabase backend for the Cueron Partner Platform.

## 📋 Prerequisites

- [ ] Supabase account (free tier is sufficient for development)
- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed
- [ ] Twilio or MSG91 account for SMS/OTP (for production)

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in project details:
   - **Organization**: Select or create one
   - **Name**: `cueron-partner-platform`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: `Mumbai (ap-south-1)` (closest to India)
   - **Pricing Plan**: Free (for development)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### Step 2: Enable PostGIS Extension

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for **"postgis"**
3. Click **"Enable"** next to PostGIS
4. Wait for confirmation

### Step 3: Run Database Migrations

**Option A: Using SQL Editor (Recommended for First Time)**

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy the contents of `supabase/migrations/00001_initial_schema.sql`
4. Paste into the editor and click **"Run"**
5. Repeat for each migration file in order:
   - `00001_initial_schema.sql` ✅
   - `00002_rls_policies.sql`
   - `00003_analytics_views.sql`
   - `00004_storage_setup.sql`
   - `00005_realtime_setup.sql`

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure SMS provider:

**For Twilio:**
- Account SID: `your_twilio_account_sid`
- Auth Token: `your_twilio_auth_token`
- Message Service SID: `your_message_service_sid`

**For MSG91:**
- Auth Key: `your_msg91_auth_key`
- Template ID: `your_template_id`

4. Click **"Save"**

### Step 5: Verify Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Verify these buckets exist:
   - ✅ `engineer-photos`
   - ✅ `job-photos`
   - ✅ `signatures`
   - ✅ `documents`
   - ✅ `invoices`

If any are missing, run `00004_storage_setup.sql` again.

### Step 6: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key
   - **service_role** secret key (⚠️ keep this secure!)

### Step 7: Configure Environment Variables

**For Web Application** (`apps/web/.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Other services (configure later)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

**For Mobile Application** (`apps/mobile/.env`):
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Other services (configure later)
GOOGLE_MAPS_API_KEY=your_google_maps_key
FCM_SERVER_KEY=your_fcm_server_key
SENTRY_DSN=your_sentry_dsn
```

### Step 8: Install Dependencies

```bash
# Install all dependencies
pnpm install

# This will install:
# - @supabase/supabase-js
# - @supabase/ssr (for web)
# - @react-native-async-storage/async-storage (for mobile)
```

### Step 9: Test the Connection

**Test Web Connection:**
```bash
cd apps/web
pnpm dev
```

Visit `http://localhost:3000` and check the browser console for any Supabase connection errors.

**Test Mobile Connection:**
```bash
cd apps/mobile
pnpm start
```

## 📊 Database Schema Overview

### Core Tables Created

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `agencies` | Partner agencies | GSTN validation, encrypted bank details |
| `engineers` | Field engineers | Location tracking, performance metrics |
| `jobs` | Service requests | Status tracking, real-time updates |
| `job_status_history` | Job timeline | Automatic status logging |
| `payments` | Financial records | Invoice generation, payment tracking |
| `agency_users` | User accounts | Role-based access control |
| `notifications` | In-app alerts | Multi-channel delivery |
| `fcm_tokens` | Push notifications | Device token management |

### Materialized Views

- `agency_monthly_metrics` - Monthly performance analytics
- `engineer_performance_metrics` - Engineer statistics
- `job_analytics` - Job insights with calculations
- `dashboard_realtime` - Real-time dashboard data

### Storage Buckets

- `engineer-photos` (5MB limit) - Profile photos
- `job-photos` (10MB limit) - Before/after service photos
- `signatures` (1MB limit) - Client signatures
- `documents` (10MB limit) - Agency documents
- `invoices` (5MB limit) - Generated invoices

## 🔒 Security Features Enabled

✅ **Row Level Security (RLS)** - All tables protected
✅ **Data Isolation** - Agencies can only see their own data
✅ **Role-Based Access** - Admin, Manager, Viewer roles
✅ **Encrypted Fields** - Bank details, PAN numbers
✅ **JWT Authentication** - Secure session management
✅ **Storage Policies** - File access control

## 🔄 Real-time Features Enabled

The following tables have real-time enabled:
- ✅ `jobs` - Live job updates
- ✅ `engineers` - Location tracking
- ✅ `job_status_history` - Status changes
- ✅ `notifications` - Instant alerts
- ✅ `payments` - Payment updates

## 🧪 Testing with Seed Data (Optional)

To populate your database with test data:

1. Go to **SQL Editor**
2. Copy contents of `supabase/seed.sql`
3. Paste and click **"Run"**

This creates:
- 3 sample agencies
- 5 sample engineers
- 4 sample jobs (various statuses)
- Sample payments and notifications

## 🛠️ Maintenance Tasks

### Refresh Materialized Views

Run this daily (or set up a cron job):

```sql
SELECT refresh_all_analytics();
```

### Cleanup Old Data

Run this weekly:

```sql
SELECT cleanup_old_storage_files();
SELECT cleanup_old_presence();
```

## 📱 Using Supabase in Your Code

### Web Application (Next.js)

```typescript
// Client Component
import { supabase } from '@/lib/supabase/client';

const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'pending');

// Server Component
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data, error } = await supabase
  .from('agencies')
  .select('*');
```

### Mobile Application (React Native)

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('assigned_engineer_id', engineerId);
```

### Real-time Subscriptions

```typescript
// Subscribe to job updates
const channel = supabase
  .channel('job-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'jobs',
      filter: `assigned_agency_id=eq.${agencyId}`
    },
    (payload) => {
      console.log('Job updated:', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## 🐛 Troubleshooting

### Issue: "PostGIS extension not found"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: "Permission denied for table"

**Solution:** Check RLS policies are enabled and user is authenticated:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Issue: "Storage bucket not accessible"

**Solution:** Verify storage policies in `00004_storage_setup.sql` and check user authentication.

### Issue: "Materialized view not updating"

**Solution:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY agency_monthly_metrics;
```

### Issue: "Real-time not working"

**Solution:**
1. Check if table is added to publication:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
2. Verify channel subscription in code
3. Check browser console for WebSocket errors

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Guide](https://supabase.com/docs/guides/realtime)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## ✅ Verification Checklist

Before moving to the next task, verify:

- [ ] Supabase project created
- [ ] PostGIS extension enabled
- [ ] All 5 migration files executed successfully
- [ ] Phone authentication configured
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Connection tested from web app
- [ ] Connection tested from mobile app
- [ ] RLS policies working (test with different users)
- [ ] Real-time subscriptions working
- [ ] Storage upload/download working

## 🎉 Next Steps

After completing this setup:

1. ✅ Task 2 Complete: Supabase backend configured
2. ➡️ Task 3: Set up third-party service integrations
3. ➡️ Task 4: Implement data models and TypeScript interfaces
4. ➡️ Task 5: Implement encryption and security utilities

---

**Need Help?** Check the `supabase/README.md` file for detailed documentation or contact the development team.
