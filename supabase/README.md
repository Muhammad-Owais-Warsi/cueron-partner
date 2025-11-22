# Supabase Database Setup Guide

This directory contains all the database migrations and configuration for the Cueron Partner Platform.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

## Quick Start

### Option 1: Using Supabase Cloud (Recommended for Production)

1. **Create a New Project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Enter project details:
     - Name: `cueron-partner-platform`
     - Database Password: (generate a strong password)
     - Region: Choose closest to your users (e.g., Mumbai for India)

2. **Enable PostGIS Extension**
   - Go to Database → Extensions
   - Search for "postgis"
   - Click "Enable" on PostGIS

3. **Run Migrations**
   
   You can run migrations in two ways:
   
   **Method A: Using SQL Editor (Easiest)**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste each migration file in order:
     1. `00001_initial_schema.sql`
     2. `00002_rls_policies.sql`
     3. `00003_analytics_views.sql`
     4. `00004_storage_setup.sql`
     5. `00005_realtime_setup.sql`
   - Click "Run" for each file

   **Method B: Using Supabase CLI**
   ```bash
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

4. **Configure Authentication**
   - Go to Authentication → Providers
   - Enable "Phone" provider
   - Configure SMS provider (Twilio or MSG91):
     - For Twilio:
       - Account SID: `your_twilio_account_sid`
       - Auth Token: `your_twilio_auth_token`
       - Message Service SID: `your_message_service_sid`

5. **Configure Storage**
   - Go to Storage
   - Verify that the following buckets are created:
     - `engineer-photos`
     - `job-photos`
     - `signatures`
     - `documents`
     - `invoices`
   - If not created automatically, run `00004_storage_setup.sql` again

6. **Get Your Credentials**
   - Go to Settings → API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` public key
     - `service_role` secret key (keep this secure!)

7. **Update Environment Variables**
   
   Update `apps/web/.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   Update `apps/mobile/.env`:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   ```

### Option 2: Local Development with Supabase CLI

1. **Initialize Supabase**
   ```bash
   supabase init
   ```

2. **Start Local Supabase**
   ```bash
   supabase start
   ```
   
   This will start:
   - PostgreSQL database on `localhost:54322`
   - API server on `localhost:54321`
   - Studio (dashboard) on `localhost:54323`

3. **Apply Migrations**
   ```bash
   supabase db reset
   ```

4. **Access Local Studio**
   - Open `http://localhost:54323`
   - Use the credentials shown in terminal

5. **Local Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Database Schema Overview

### Core Tables

1. **agencies** - Partner agency information
2. **engineers** - Field engineer profiles
3. **jobs** - Service job requests
4. **job_status_history** - Job status change tracking
5. **payments** - Payment records and invoices
6. **agency_users** - Agency user accounts and roles
7. **notifications** - In-app notifications
8. **fcm_tokens** - Push notification tokens

### Views and Materialized Views

1. **agency_monthly_metrics** - Monthly performance metrics per agency
2. **engineer_performance_metrics** - Engineer performance statistics
3. **job_analytics** - Job analytics with calculated fields
4. **dashboard_realtime** - Real-time dashboard data

### Storage Buckets

1. **engineer-photos** - Engineer profile photos (5MB limit)
2. **job-photos** - Before/after service photos (10MB limit)
3. **signatures** - Client signatures (1MB limit)
4. **documents** - Agency documents (10MB limit)
5. **invoices** - Generated invoices (5MB limit)

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Agencies can only access their own data
- Engineers can only access their assigned jobs
- Role-based access control (admin, manager, viewer)
- Data isolation between agencies

### Encryption

The following fields should be encrypted at the application level:
- `agencies.bank_account_number`
- `agencies.pan_number`
- `payments.bank_account_number` (if stored)

Use AES-256-CBC encryption with a secure key stored in environment variables.

## Realtime Features

### Enabled Tables

The following tables have realtime enabled:
- `jobs` - For live job updates
- `engineers` - For location tracking
- `job_status_history` - For status updates
- `notifications` - For instant notifications
- `payments` - For payment status updates

### Subscribing to Changes

**Web Application Example:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Subscribe to job updates for an agency
const channel = supabase
  .channel('agency-jobs')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'jobs',
      filter: `assigned_agency_id=eq.${agencyId}`
    },
    (payload) => {
      console.log('Job updated:', payload)
    }
  )
  .subscribe()
```

**Mobile Application Example:**
```typescript
// Subscribe to engineer's assigned jobs
const channel = supabase
  .channel('engineer-jobs')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'jobs',
      filter: `assigned_engineer_id=eq.${engineerId}`
    },
    (payload) => {
      console.log('Job updated:', payload)
    }
  )
  .subscribe()
```

## Maintenance

### Refresh Materialized Views

Materialized views should be refreshed periodically:

```sql
-- Refresh all analytics views
SELECT refresh_all_analytics();

-- Or refresh individually
SELECT refresh_agency_monthly_metrics();
SELECT refresh_engineer_performance_metrics();
```

**Recommended Schedule:**
- Run daily at 2 AM: `SELECT refresh_all_analytics();`
- Can be automated using pg_cron extension or external cron job

### Cleanup Old Data

```sql
-- Cleanup old storage files
SELECT cleanup_old_storage_files();

-- Cleanup old presence records
SELECT cleanup_old_presence();
```

### Backup Strategy

**Automated Backups (Supabase Cloud):**
- Daily backups are automatic on paid plans
- Point-in-time recovery available

**Manual Backup:**
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Using pg_dump
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

## Performance Optimization

### Indexes

All necessary indexes are created in the migrations:
- Primary keys and foreign keys
- Status fields for filtering
- Location fields (GIST indexes for PostGIS)
- Timestamp fields for date range queries

### Query Optimization Tips

1. **Use materialized views** for complex analytics queries
2. **Filter by agency_id** first in queries (leverages RLS)
3. **Use spatial indexes** for location-based queries
4. **Limit result sets** with pagination
5. **Use connection pooling** (Supabase handles this automatically)

## Troubleshooting

### Common Issues

**Issue: PostGIS extension not found**
```sql
-- Enable PostGIS manually
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Issue: RLS policies blocking queries**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Temporarily disable for testing (NOT for production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**Issue: Materialized view not updating**
```sql
-- Force refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY agency_monthly_metrics;
```

**Issue: Storage bucket not accessible**
- Check bucket policies in `00004_storage_setup.sql`
- Verify user authentication
- Check file path format: `bucket-name/folder/file.ext`

## Migration Management

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new your_migration_name

# Edit the file in supabase/migrations/
# Then apply it
supabase db push
```

### Rolling Back Migrations

```bash
# Reset to a specific migration
supabase db reset --version 00003

# Reset completely
supabase db reset
```

## Testing

### Seed Data

Create a seed file for testing:

```sql
-- supabase/seed.sql
INSERT INTO agencies (name, type, gstn, contact_person, phone, email, ...)
VALUES (...);

INSERT INTO engineers (agency_id, name, phone, ...)
VALUES (...);
```

Apply seed data:
```bash
supabase db seed
```

## Support

For issues or questions:
1. Check [Supabase Documentation](https://supabase.com/docs)
2. Review migration files for schema details
3. Check Supabase logs in dashboard
4. Contact development team

## Next Steps

After setting up the database:
1. ✅ Configure environment variables in web and mobile apps
2. ✅ Set up Supabase client in application code
3. ✅ Implement authentication flows
4. ✅ Test RLS policies with different user roles
5. ✅ Set up realtime subscriptions
6. ✅ Configure storage bucket access
7. ✅ Schedule materialized view refreshes
