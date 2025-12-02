# Demo User Quick Start Guide

Quick reference for creating and managing demo users.

## Create a Demo User (3 Steps)

### 1. Create User Account
```bash
node create-user.js demo@example.com password123 "Demo User"
```
Save the user ID from the output.

### 2. Mark as Demo User
```bash
node manage-demo-users.js set <user-id>
```

### 3. Verify
```bash
node manage-demo-users.js check <user-id>
```

## Common Commands

```bash
# List all demo users
node manage-demo-users.js list

# Remove demo status
node manage-demo-users.js unset <user-id>

# Check user status
node manage-demo-users.js check <user-id>
```

## What Demo Users See

✅ Realistic dashboard data (earnings, jobs, engineers, analytics)  
✅ Consistent data across sessions  
✅ All UI features work normally  
❌ Cannot modify data (writes are blocked)

## Prerequisites

Add to `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get the service role key from: Supabase Dashboard → Settings → API

## Full Documentation

See [DEMO_USER_MANAGEMENT.md](./DEMO_USER_MANAGEMENT.md) for complete documentation.

## Troubleshooting

**Error: SUPABASE_SERVICE_ROLE_KEY is not set**  
→ Add the key to `apps/web/.env.local`

**Demo user sees real data**  
→ Log out and log back in to refresh session

**Cannot set demo flag**  
→ Verify user exists in `agency_users` table

## Support

For issues, check:
1. [DEMO_USER_MANAGEMENT.md](./DEMO_USER_MANAGEMENT.md) - Full guide
2. [apps/web/src/lib/demo-data/README.md](./apps/web/src/lib/demo-data/README.md) - Technical docs
3. [.kiro/specs/dashboard-demo-data/design.md](./.kiro/specs/dashboard-demo-data/design.md) - Design document
