# Demo Data System

This directory contains the complete demo data system for the dashboard application.

## Overview

The demo data system allows designated users to see realistic generated data instead of real database data. This is useful for:

- Product demonstrations
- User onboarding and training
- Testing and QA
- Sales presentations

## Components

### Core Modules

1. **seeded-random.ts** - Deterministic random number generator
   - Ensures the same user always sees the same data
   - Uses Mulberry32 algorithm for consistent results

2. **generator.ts** - Demo data generation
   - Generates realistic earnings, jobs, engineers, and analytics data
   - All data falls within realistic ranges
   - Matches production data structures exactly

3. **middleware.ts** - Demo user detection
   - Detects demo users from session data
   - Routes requests to demo data or real database
   - Prevents write operations for demo users

4. **user-management.ts** - Demo user administration
   - Functions to set/unset demo user flags
   - Query demo users
   - Check demo user status

### Tests

- **seeded-random.test.ts** - Property-based tests for random generator
- **generator.test.ts** - Property-based tests for data generation
- **middleware.test.ts** - Property-based tests for demo detection
- **user-management.test.ts** - Unit tests for user management

## Usage

### For Developers

Import functions from the index:

```typescript
import {
  generateDashboardData,
  isDemoUser,
  setDemoUserFlag,
} from '@/lib/demo-data';
```

### For Administrators

Use the command-line utility:

```bash
# Mark user as demo user
node manage-demo-users.js set <user-id>

# Unmark user as demo user
node manage-demo-users.js unset <user-id>

# List all demo users
node manage-demo-users.js list

# Check demo status
node manage-demo-users.js check <user-id>
```

See [DEMO_USER_MANAGEMENT.md](../../../../../DEMO_USER_MANAGEMENT.md) for complete documentation.

## API Integration

Demo data is integrated into these API endpoints:

- `/api/agencies/[id]/analytics` - Dashboard analytics
- `/api/agencies/[id]/earnings` - Earnings data
- `/api/agencies/[id]/jobs` - Job listings
- `/api/agencies/[id]/engineers` - Engineer listings

Each endpoint checks for demo users and serves generated data accordingly:

```typescript
const session = await getUserSession();

if (isDemoUser(session)) {
  return NextResponse.json(generateDashboardData(session.user_id));
}

// Normal database query...
```

## Write Protection

Demo users cannot modify data. All POST/PUT/DELETE endpoints check for demo users:

```typescript
if (isDemoUser(session)) {
  return NextResponse.json(
    { error: 'Demo users cannot modify data' },
    { status: 403 }
  );
}
```

## Testing

Run all demo data tests:

```bash
cd apps/web
npm test -- src/lib/demo-data
```

Note: Integration tests (user-management.test.ts) require a running Supabase instance and will skip if unavailable.

## Documentation

- [DEMO_USER_MANAGEMENT.md](../../../../../DEMO_USER_MANAGEMENT.md) - Complete user guide
- [Design Document](../../../../../.kiro/specs/dashboard-demo-data/design.md) - Technical design
- [Requirements](../../../../../.kiro/specs/dashboard-demo-data/requirements.md) - Feature requirements
- [WRITE_PREVENTION_STATUS.md](./WRITE_PREVENTION_STATUS.md) - Write protection implementation

## Architecture

```
┌─────────────────┐
│  Dashboard UI   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  (middleware)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────┐
│Database│  │Generator │
└────────┘  └──────────┘
```

## Key Features

✅ **Deterministic** - Same user always sees same data  
✅ **Realistic** - Values match production patterns  
✅ **Complete** - All required fields populated  
✅ **Safe** - Write operations blocked  
✅ **Tested** - Comprehensive property-based tests  
✅ **Documented** - Full documentation and examples
