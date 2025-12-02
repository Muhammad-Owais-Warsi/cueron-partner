# Demo Data Feature - Complete Overview

## Introduction

The demo data feature enables the dashboard to display realistic, deterministic dummy data for designated demo users. This allows stakeholders to explore the application's functionality without needing real data, making it ideal for:

- **Product Demonstrations**: Show potential clients a fully-populated dashboard
- **User Onboarding**: Let new users explore features without setup
- **Testing & QA**: Test UI components with consistent, realistic data
- **Sales Presentations**: Present a professional, data-rich interface

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Login                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Authentication System loads user profile with              │
│  is_demo_user flag from database                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Dashboard makes API requests                                │
│  (analytics, earnings, jobs, engineers)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  API Route checks session.is_demo_user flag                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  Demo User?      │  │  Real User?      │
    │  Generate Data   │  │  Query Database  │
    └──────────────────┘  └──────────────────┘
                │                 │
                └────────┬────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Return data to dashboard                                    │
│  UI renders identically for both cases                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Deterministic Generation**: Same user ID always produces same data
   - Uses seeded random number generator (Mulberry32 algorithm)
   - User ID is hashed to create numeric seed
   - Ensures consistency across sessions and server restarts

2. **Realistic Data**: Values match production patterns
   - Daily earnings: ₹5,000 - ₹25,000
   - Monthly earnings: ₹150,000 - ₹600,000
   - Ratings: 3.5 - 5.0 stars
   - Job counts, engineer metrics, etc. all within realistic ranges

3. **Complete Structures**: Generated data matches database schemas exactly
   - All required fields populated
   - Correct data types
   - Valid relationships between entities

4. **Write Protection**: Demo users cannot modify data
   - All POST/PUT/DELETE operations blocked
   - Returns 403 Forbidden with clear error message
   - Prevents accidental data corruption

## Quick Start

### For Administrators

Create a demo user in 3 steps:

```bash
# 1. Create user account
node create-user.js demo@example.com password123 "Demo User"
# Save the user ID from output

# 2. Mark as demo user
node manage-demo-users.js set <user-id>

# 3. Verify
node manage-demo-users.js check <user-id>
```

See [DEMO_USER_QUICK_START.md](./DEMO_USER_QUICK_START.md) for details.

### For Developers

Integrate demo data in API routes:

```typescript
import { isDemoUser, generateDashboardData } from '@/lib/demo-data';
import { getUserSession } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  
  if (isDemoUser(session)) {
    return NextResponse.json(generateDashboardData(session.user_id));
  }
  
  // Normal database query for real users
  const { data } = await supabase.from('analytics').select('*');
  return NextResponse.json(data);
}
```

## Components

### 1. Seeded Random Number Generator
**File**: `apps/web/src/lib/demo-data/seeded-random.ts`

Provides deterministic pseudo-random number generation using the Mulberry32 algorithm.

**Key Methods**:
- `next()`: Generate float between 0-1
- `nextInt(min, max)`: Generate integer in range
- `nextFloat(min, max)`: Generate float in range
- `pick(array)`: Pick random element
- `shuffle(array)`: Shuffle array deterministically

**Why Deterministic?**
- Same user always sees same data
- Data persists across sessions
- No database storage needed
- Consistent for testing

### 2. Data Generator
**File**: `apps/web/src/lib/demo-data/generator.ts`

Generates realistic demo data matching production formats.

**Functions**:
- `generateEarnings(userId)`: Daily, monthly, yearly earnings
- `generateDashboardData(userId, period)`: Complete dashboard metrics
- `generateMonthlyMetrics(userId, months)`: Time-series chart data
- `generateJobs(userId, count)`: Job listings with varied statuses
- `generateEngineers(userId, count)`: Engineer profiles with metrics

**Data Ranges**:
```typescript
DAILY_EARNINGS: ₹5,000 - ₹25,000
MONTHLY_EARNINGS: ₹150,000 - ₹600,000
YEARLY_EARNINGS: ₹1,800,000 - ₹7,200,000
AVG_RATING: 3.5 - 5.0 stars
TOTAL_ENGINEERS: 10 - 50
ACTIVE_ENGINEERS: 50% - 80% of total
```

### 3. Demo Detection Middleware
**File**: `apps/web/src/lib/demo-data/middleware.ts`

Detects demo users and routes data requests appropriately.

**Functions**:
- `isDemoUser(session)`: Check if session is demo user
- `getDemoOrRealData(session, demoFn, realFn)`: Route to appropriate data source
- `preventDemoUserWrites(session)`: Block write operations for demo users

**Error Handling**:
- Null sessions default to non-demo
- Missing flags default to non-demo
- Invalid flag values default to non-demo
- Logs warnings for malformed data

### 4. User Management
**File**: `apps/web/src/lib/demo-data/user-management.ts`

Programmatic API for managing demo user flags.

**Functions**:
- `setDemoUserFlag(url, key, userId)`: Mark user as demo
- `unsetDemoUserFlag(url, key, userId)`: Unmark user as demo
- `queryDemoUsers(url, key)`: List all demo users
- `isDemoUserById(url, key, userId)`: Check demo status

**CLI Tool**: `manage-demo-users.js`
```bash
node manage-demo-users.js set <user-id>     # Enable demo mode
node manage-demo-users.js unset <user-id>   # Disable demo mode
node manage-demo-users.js list              # List all demo users
node manage-demo-users.js check <user-id>   # Check status
```

## Database Schema

### Migration: `00009_add_demo_user_flag.sql`

```sql
-- Add demo user flag column
ALTER TABLE agency_users 
ADD COLUMN is_demo_user BOOLEAN DEFAULT FALSE;

-- Create index for efficient queries
CREATE INDEX idx_agency_users_demo 
ON agency_users(is_demo_user) 
WHERE is_demo_user = TRUE;

-- Add comment
COMMENT ON COLUMN agency_users.is_demo_user IS 
'Flag indicating if this user should see demo data instead of real data';
```

### Session Extension

```typescript
interface UserSession {
  user_id: string;
  role: 'admin' | 'manager' | 'viewer' | 'engineer';
  agency_id: string | null;
  is_demo_user?: boolean;  // NEW: Demo user flag
  email?: string;
  phone?: string;
}
```

## API Integration

### Integrated Endpoints

Demo data is integrated into these API endpoints:

✅ **Analytics**: `/api/agencies/[id]/analytics`
- Returns generated dashboard data with summary, charts, and trends

✅ **Earnings**: `/api/agencies/[id]/earnings`
- Returns generated earnings data (daily, monthly, yearly)

✅ **Jobs**: `/api/agencies/[id]/jobs`
- Returns generated job listings with pagination support

✅ **Engineers**: `/api/agencies/[id]/engineers`
- Returns generated engineer profiles with status filters

### Write Protection

All write endpoints check for demo users:

✅ **Job Operations**:
- POST `/api/jobs` - Create job
- POST `/api/jobs/[id]/assign` - Assign engineer
- PATCH `/api/jobs/[id]/status` - Update status
- POST `/api/jobs/[id]/complete` - Complete job
- POST `/api/jobs/[id]/photos` - Upload photos
- PATCH `/api/jobs/[id]/checklist` - Update checklist

See [WRITE_PREVENTION_STATUS.md](./apps/web/src/lib/demo-data/WRITE_PREVENTION_STATUS.md) for complete list.

## Testing

### Property-Based Tests

The demo data system uses property-based testing to verify correctness across many inputs:

**Test Files**:
- `seeded-random.test.ts`: Tests random generator properties
- `generator.test.ts`: Tests data generation properties
- `middleware.test.ts`: Tests demo detection properties
- `user-management.test.ts`: Tests user management functions

**Key Properties Tested**:
1. **Deterministic Generation**: Same seed produces same output
2. **Numeric Bounds**: All values within realistic ranges
3. **Data Completeness**: All required fields present
4. **Time-Series Ordering**: Dates in chronological order
5. **Collection Variety**: Multiple distinct values in collections
6. **Seed Uniqueness**: Different seeds produce different data
7. **Rating Constraints**: Ratings between 3.5-5.0
8. **Name Format**: Valid name strings
9. **Timestamp Recency**: Dates within last 365 days
10. **Write Prevention**: Demo users blocked from writes

**Run Tests**:
```bash
cd apps/web
npm test -- src/lib/demo-data
```

### Integration Tests

Integration tests verify end-to-end flows:

**Test Files**:
- `demo-data-integration.test.ts`: Tests API endpoint integration
- `demo-write-prevention.test.ts`: Tests write operation blocking

## Documentation

### User Documentation
- **[DEMO_USER_QUICK_START.md](./DEMO_USER_QUICK_START.md)**: Quick reference guide
- **[DEMO_USER_MANAGEMENT.md](./DEMO_USER_MANAGEMENT.md)**: Complete user guide with troubleshooting

### Technical Documentation
- **[apps/web/src/lib/demo-data/README.md](./apps/web/src/lib/demo-data/README.md)**: Module documentation
- **[.kiro/specs/dashboard-demo-data/design.md](./.kiro/specs/dashboard-demo-data/design.md)**: Technical design document
- **[.kiro/specs/dashboard-demo-data/requirements.md](./.kiro/specs/dashboard-demo-data/requirements.md)**: Feature requirements
- **[WRITE_PREVENTION_STATUS.md](./apps/web/src/lib/demo-data/WRITE_PREVENTION_STATUS.md)**: Write protection status

### Code Documentation
All key functions have comprehensive JSDoc comments:
- Parameter descriptions
- Return value documentation
- Usage examples
- Error handling notes
- Requirements traceability

## Best Practices

### For Administrators

1. **Use Descriptive Emails**: Name demo users clearly
   ```bash
   node create-user.js demo-sales@example.com password123 "Sales Demo"
   node create-user.js demo-training@example.com password123 "Training Demo"
   ```

2. **Document Demo Users**: Keep a list of demo credentials
   ```bash
   node manage-demo-users.js list > demo-users.txt
   ```

3. **Regular Cleanup**: Remove unused demo users periodically
   ```bash
   node manage-demo-users.js unset <old-user-id>
   ```

4. **Test Before Sharing**: Always verify demo users work correctly
   ```bash
   node manage-demo-users.js check <user-id>
   # Then log in and verify dashboard
   ```

### For Developers

1. **Check Demo Status Early**: Check at the start of API handlers
   ```typescript
   const session = await getUserSession();
   if (isDemoUser(session)) {
     return NextResponse.json(generateData(session.user_id));
   }
   ```

2. **Use Helper Functions**: Use `getDemoOrRealData` for cleaner code
   ```typescript
   const data = await getDemoOrRealData(
     session,
     () => generateDashboardData(session.user_id),
     async () => await queryDatabase()
   );
   ```

3. **Block Writes**: Always check demo status in write endpoints
   ```typescript
   const demoError = preventDemoUserWrites(session);
   if (demoError) return demoError;
   ```

4. **Add Tests**: Test both demo and real user paths
   ```typescript
   it('should return demo data for demo users', async () => {
     const session = { user_id: 'test', is_demo_user: true };
     const data = await handler(session);
     expect(data).toBeDefined();
   });
   ```

## Security Considerations

### Authentication
- Demo users require proper authentication (no bypass)
- Demo flag only affects data source, not auth requirements
- Session management identical to real users

### Data Isolation
- Demo users never access real user data
- Demo data generated on-the-fly (not stored)
- No cross-contamination between demo and real data

### Write Protection
- All write operations blocked at API level
- Server-side validation (never trust client)
- Clear error messages for blocked operations
- Audit logs track demo user actions separately

### Environment Variables
- Service role key never committed to version control
- Demo user credentials stored securely
- Environment-specific configuration

## Troubleshooting

### Common Issues

**Demo user sees real data**
- Verify demo flag is set: `node manage-demo-users.js check <user-id>`
- Log out and log back in to refresh session
- Check API endpoint has demo detection logic

**Cannot set demo flag**
- Verify user exists in `agency_users` table
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Ensure service role has update permissions

**Demo data looks different after logout/login**
- This should NOT happen (data is deterministic)
- Verify user ID hasn't changed
- Check seeded random generator implementation

**Write operations not blocked**
- Verify endpoint has `preventDemoUserWrites()` check
- Check session includes `is_demo_user` flag
- Review write prevention implementation

See [DEMO_USER_MANAGEMENT.md](./DEMO_USER_MANAGEMENT.md) for detailed troubleshooting.

## Future Enhancements

### Potential Phase 2 Features

1. **Demo Data Customization**
   - Allow admins to configure value ranges
   - Adjust engineer counts, job types, etc.
   - Per-user customization

2. **Demo Scenarios**
   - Pre-defined scenarios (high-performing, struggling, new agency)
   - Switch between scenarios
   - Scenario templates

3. **UI Indicators**
   - Visual indicator showing demo mode
   - Banner or badge in dashboard
   - Clear distinction from real data

4. **Time Travel**
   - View data "as of" different dates
   - Historical data simulation
   - Trend visualization

5. **Interactive Demo Mode**
   - Simulate actions and see results
   - Temporary state changes
   - Reset to initial state

6. **Demo Data Export**
   - Export demo data for presentations
   - PDF reports with demo data
   - Screenshot-ready views

## Support

### Getting Help

1. **Check Documentation**:
   - [DEMO_USER_QUICK_START.md](./DEMO_USER_QUICK_START.md) for quick reference
   - [DEMO_USER_MANAGEMENT.md](./DEMO_USER_MANAGEMENT.md) for detailed guide
   - [apps/web/src/lib/demo-data/README.md](./apps/web/src/lib/demo-data/README.md) for technical docs

2. **Review Implementation**:
   - Check `apps/web/src/lib/demo-data/` for source code
   - Review test files for usage examples
   - Check API routes for integration patterns

3. **Verify Configuration**:
   - Ensure environment variables are set
   - Check database migration has run
   - Verify Supabase connection

4. **Check Logs**:
   - Review application logs for errors
   - Check Supabase logs for database issues
   - Look for demo data generation warnings

## Summary

The demo data feature provides a complete solution for displaying realistic dummy data to designated users. It's:

✅ **Deterministic**: Same user always sees same data  
✅ **Realistic**: Values match production patterns  
✅ **Complete**: All fields populated correctly  
✅ **Safe**: Write operations blocked  
✅ **Tested**: Comprehensive property-based tests  
✅ **Documented**: Full documentation and examples  
✅ **Easy to Use**: Simple CLI and programmatic API  

Perfect for demonstrations, onboarding, testing, and sales presentations!
