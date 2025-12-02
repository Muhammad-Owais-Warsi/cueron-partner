# Demo User Management Guide

This guide explains how to create and manage demo users in the dashboard application. Demo users see realistic generated data instead of real database data, making them perfect for demonstrations, testing, and onboarding.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Creating Demo Users](#creating-demo-users)
- [Managing Demo Users](#managing-demo-users)
- [Programmatic Usage](#programmatic-usage)
- [How Demo Data Works](#how-demo-data-works)
- [Troubleshooting](#troubleshooting)

## Overview

Demo users are regular user accounts with a special `is_demo_user` flag set to `true` in the database. When a demo user logs in and accesses the dashboard:

- All read operations return generated demo data instead of querying the database
- All write operations (POST, PUT, DELETE) are blocked to prevent data corruption
- Demo data is deterministic - the same user always sees the same data
- Demo data is realistic and visually indistinguishable from real data

## Prerequisites

Before managing demo users, ensure you have:

1. **Supabase Service Role Key**: Get this from your Supabase dashboard (Settings → API → service_role secret key)
2. **Environment Variables**: Add to `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. **Node.js**: Ensure Node.js is installed (v18 or higher recommended)

## Creating Demo Users

### Step 1: Create a Regular User Account

First, create a regular user account using the existing user creation script:

```bash
node create-user.js demo@example.com password123 "Demo User" "+1234567890"
```

This will output the user ID. Save this ID for the next step.

### Step 2: Mark the User as a Demo User

Use the demo user management script to set the demo flag:

```bash
node manage-demo-users.js set <user-id>
```

Example:
```bash
node manage-demo-users.js set abc123-def456-ghi789
```

### Step 3: Verify Demo Status

Check that the demo flag was set correctly:

```bash
node manage-demo-users.js check <user-id>
```

You should see output like:
```
User Information:
🆔 User ID: abc123-def456-ghi789
👤 Role: manager
🏢 Agency ID: xyz789
🏢 Agency Name: Demo Agency
🎭 Demo Status: ✅ ENABLED
```

### Step 4: Test the Demo User

Log in to the dashboard with the demo user credentials. You should see:
- Realistic dashboard data (earnings, jobs, engineers, analytics)
- Data that remains consistent across sessions
- Blocked write operations (if you try to modify data)

## Managing Demo Users

### List All Demo Users

To see all users marked as demo users:

```bash
node manage-demo-users.js list
```

Output:
```
Found 2 demo user(s):

1. User ID: abc123-def456-ghi789
   Role: manager
   Agency ID: xyz789
   Agency Name: Demo Agency

2. User ID: def456-ghi789-jkl012
   Role: admin
   Agency ID: xyz789
   Agency Name: Test Agency
```

### Check Demo Status

To check if a specific user is a demo user:

```bash
node manage-demo-users.js check <user-id>
```

### Disable Demo Mode

To convert a demo user back to a regular user:

```bash
node manage-demo-users.js unset <user-id>
```

Example:
```bash
node manage-demo-users.js unset abc123-def456-ghi789
```

After this, the user will see real database data instead of generated demo data.

### Toggle Demo Mode

You can toggle demo mode on and off as needed:

```bash
# Enable demo mode
node manage-demo-users.js set <user-id>

# Disable demo mode
node manage-demo-users.js unset <user-id>

# Enable again
node manage-demo-users.js set <user-id>
```

## Programmatic Usage

You can also manage demo users programmatically in your code:

```typescript
import {
  setDemoUserFlag,
  unsetDemoUserFlag,
  queryDemoUsers,
  isDemoUserById,
} from '@/lib/demo-data/user-management';

// Set demo flag
const result = await setDemoUserFlag(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  userId
);

if (result.success) {
  console.log('Demo flag set successfully');
} else {
  console.error('Error:', result.error);
}

// Unset demo flag
await unsetDemoUserFlag(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  userId
);

// Query all demo users
const demoUsers = await queryDemoUsers(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Demo user IDs:', demoUsers.userIds);

// Check if user is demo
const status = await isDemoUserById(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  userId
);

console.log('Is demo user:', status.isDemo);
```

## How Demo Data Works

### Data Generation

Demo data is generated on-the-fly using a seeded random number generator:

1. **Deterministic**: Uses the user ID as a seed, so the same user always sees the same data
2. **Realistic**: Values fall within realistic ranges (e.g., earnings between ₹5,000-₹25,000 daily)
3. **Complete**: Includes all fields required by the UI (earnings, jobs, engineers, analytics)
4. **Varied**: Different demo users see different data

### API Behavior

When a demo user makes API requests:

```typescript
// In API routes
const session = await getUserSession();

if (session?.is_demo_user) {
  // Return generated demo data
  return generateDashboardData(session.user_id);
} else {
  // Query real database
  return await supabase.from('jobs').select('*');
}
```

### Write Protection

Demo users cannot modify data:

```typescript
// In POST/PUT/DELETE endpoints
if (session?.is_demo_user) {
  return NextResponse.json(
    { error: 'Demo users cannot modify data' },
    { status: 403 }
  );
}
```

## Troubleshooting

### Error: SUPABASE_SERVICE_ROLE_KEY is not set

**Solution**: Add the service role key to `apps/web/.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get the key from: Supabase Dashboard → Settings → API → service_role secret key

### Error: User not found in agency_users table

**Solution**: The user must have a record in the `agency_users` table. Create one:

```sql
INSERT INTO agency_users (user_id, agency_id, role, is_demo_user)
VALUES ('user-id-here', 'agency-id-here', 'manager', false);
```

Or use the `create-user.js` script which handles this automatically.

### Demo user sees real data instead of demo data

**Possible causes**:
1. Demo flag not set correctly - run `node manage-demo-users.js check <user-id>`
2. Session not refreshed - log out and log back in
3. API endpoint not checking demo flag - verify the endpoint implementation

### Demo data looks different after logout/login

**This should not happen**. Demo data is deterministic. If you see different data:
1. Verify the user ID hasn't changed
2. Check if the seeded random generator is working correctly
3. Review the demo data generation logic

### Cannot set demo flag

**Possible causes**:
1. Invalid user ID - verify the user exists
2. Missing service role key - check environment variables
3. Database permissions - ensure service role has update permissions

## Best Practices

1. **Use descriptive emails**: Name demo users clearly (e.g., `demo-sales@example.com`)
2. **Document demo users**: Keep a list of demo user credentials for your team
3. **Regular cleanup**: Periodically review and remove unused demo users
4. **Test thoroughly**: Always test demo users before sharing with stakeholders
5. **Separate agencies**: Consider creating dedicated agencies for demo users

## Security Considerations

- **Service role key**: Never commit the service role key to version control
- **Demo user credentials**: Store demo user passwords securely
- **Write protection**: Demo users cannot modify data, but they can still read their generated data
- **Authentication**: Demo users still require proper authentication (no bypass)

## Related Documentation

- [Demo Data Generator](apps/web/src/lib/demo-data/generator.ts) - How demo data is generated
- [Demo Detection Middleware](apps/web/src/lib/demo-data/middleware.ts) - How demo users are detected
- [User Management Module](apps/web/src/lib/demo-data/user-management.ts) - Programmatic API
- [Design Document](.kiro/specs/dashboard-demo-data/design.md) - Complete technical design

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the demo data implementation in `apps/web/src/lib/demo-data/`
3. Check Supabase logs for database errors
4. Verify environment variables are set correctly
