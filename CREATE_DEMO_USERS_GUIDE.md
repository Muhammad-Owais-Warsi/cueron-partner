# Create Demo Users - Complete Guide

## Current Situation

You have Supabase configured for local development, but the Supabase CLI is not installed yet. The keys in your `apps/web/.env.local` are the default local development keys.

## Option 1: Use Local Supabase (Recommended for Development)

### Step 1: Install Supabase CLI

**Windows (using Scoop):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or using npm:**
```powershell
npm install -g supabase
```

### Step 2: Start Supabase Locally

```powershell
supabase start
```

This will start all Supabase services locally. It may take a few minutes the first time.

### Step 3: Update Environment Variables

After `supabase start` completes, it will display the local URLs and keys. Update `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_supabase_start>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_supabase_start>
```

### Step 4: Run Database Migrations

```powershell
supabase db reset
```

This will apply all migrations including the `is_demo_user` column.

### Step 5: Create Demo Users

```powershell
node create-demo-user.js demo@example.com DemoPass123 "Demo User"
node create-demo-user.js demo2@example.com DemoPass123 "Demo User 2"
```

---

## Option 2: Use Remote Supabase Project

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - Name: cueron-partner-platform
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (~2 minutes)

### Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

### Step 3: Update Environment Variables

Update `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Run Database Migrations

You need to apply the migrations to your remote database. You can either:

**Option A: Using Supabase CLI**
```powershell
# Install CLI first (see Option 1, Step 1)
supabase link --project-ref your-project-ref
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your project dashboard
2. Click **SQL Editor**
3. Run the migration files from `supabase/migrations/` one by one

### Step 5: Create Demo Users

```powershell
node create-demo-user.js demo@example.com DemoPass123 "Demo User"
node create-demo-user.js demo2@example.com DemoPass123 "Demo User 2"
```

---

## Option 3: Quick Test with Existing Setup

If you just want to test quickly and your current keys work with a remote instance:

### Check if your current setup works:

```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path:'apps/web/.env.local'}); const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('agencies').select('count').then(r => console.log('✅ Connection works!', r)).catch(e => console.log('❌ Connection failed:', e.message));"
```

If this works, you can proceed directly to creating demo users:

```powershell
node create-demo-user.js demo@example.com DemoPass123 "Demo User"
```

---

## Troubleshooting

### Error: "Invalid API key"
- Your Supabase instance is not running or the keys are incorrect
- For local: Make sure `supabase start` is running
- For remote: Double-check your API keys from the dashboard

### Error: "relation 'agency_users' does not exist"
- Database migrations haven't been applied
- Run `supabase db reset` (local) or apply migrations manually (remote)

### Error: "Failed to create agency user"
- The `is_demo_user` column might not exist
- Check if migration `20240101000000_add_demo_user_flag.sql` was applied
- You can manually add it:
  ```sql
  ALTER TABLE agency_users ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT FALSE;
  ```

---

## What's Next?

After creating demo users, you can:

1. **Log in** with the demo user credentials
2. **See demo data** on the dashboard (earnings, jobs, engineers, analytics)
3. **Test the feature** - data should be consistent across sessions
4. **Verify write protection** - try to modify data (should be blocked)

## Managing Demo Users

```powershell
# List all demo users
node manage-demo-users.js list

# Check a specific user
node manage-demo-users.js check <user-id>

# Remove demo status
node manage-demo-users.js unset <user-id>

# Add demo status to existing user
node manage-demo-users.js set <user-id>
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `node create-demo-user.js <email> <password> <name>` | Create new demo user |
| `node manage-demo-users.js list` | List all demo users |
| `node manage-demo-users.js check <user-id>` | Check demo status |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase status` | Check Supabase status |

