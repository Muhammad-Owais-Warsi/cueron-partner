# Apply Demo User Migration

## Quick Fix - Run This SQL in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add is_demo_user column to agency_users table
ALTER TABLE agency_users 
ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for efficient demo user queries
CREATE INDEX IF NOT EXISTS idx_agency_users_demo 
ON agency_users(is_demo_user) 
WHERE is_demo_user = TRUE;

-- Add comment to document the column purpose
COMMENT ON COLUMN agency_users.is_demo_user IS 
'Flag indicating if this user is a demo/mock user. Demo users see generated demo data instead of real database data.';
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

## Verify It Worked

Run this command:

```powershell
node manage-demo-users.js list
```

If you see "No demo users found" instead of an error, the migration worked!

## Then Create Demo Users

```powershell
# Create a new demo user (all in one step)
node create-demo-user.js demo@example.com password123 "Demo User"

# Or mark your existing user as demo
node manage-demo-users.js set dea85246-480e-430b-a798-925aabfcd3f1
```

## Alternative: Check if Column Exists

You can verify the column exists by running this in SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'agency_users' AND column_name = 'is_demo_user';
```

This should return one row showing the `is_demo_user` column details.
