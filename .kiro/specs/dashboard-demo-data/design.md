# Design Document

## Overview

This design implements a demo data system for the dashboard that serves realistic, deterministic dummy data to mock users. The system consists of three main components: a demo data generator that creates realistic data structures, a user identification mechanism that flags mock users, and API middleware that intercepts requests from mock users to serve generated data instead of querying the database.

The design prioritizes simplicity and maintainability by generating data on-the-fly using deterministic algorithms seeded by user IDs, rather than storing pre-generated data in the database. This approach ensures consistency across sessions while minimizing storage requirements and complexity.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Dashboard UI   │
│   Components    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│  (with demo     │
│   detection)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────────┐
│Database│  │ Demo Data    │
│Queries │  │ Generator    │
└────────┘  └──────────────┘
```

### Component Interaction Flow

1. User logs in → Authentication system loads user profile with `is_demo_user` flag
2. Dashboard makes API request → API route checks session for demo flag
3. If demo user → Generate deterministic demo data using user ID as seed
4. If real user → Query database normally
5. Return data to dashboard → UI renders identically for both cases

## Components and Interfaces

### 1. Demo Data Generator (`lib/demo-data/generator.ts`)

A utility module that generates realistic demo data structures matching production data formats.

```typescript
interface DemoDataGenerator {
  // Generate earnings data
  generateEarnings(userId: string): EarningsData;
  
  // Generate dashboard analytics data
  generateDashboardData(userId: string, period: string): DashboardData;
  
  // Generate job list data
  generateJobs(userId: string, count: number): Job[];
  
  // Generate engineer list data
  generateEngineers(userId: string, count: number): Engineer[];
  
  // Generate monthly metrics for charts
  generateMonthlyMetrics(userId: string, months: number): MonthlyMetric[];
}
```

**Key Features:**
- Uses seeded random number generation for deterministic output
- Generates realistic value ranges based on production data patterns
- Creates time-series data with realistic temporal patterns
- Produces data structures that exactly match database query results

### 2. User Profile Extension

Extend existing user profile types to include demo user flag.

```typescript
interface UserProfile {
  type: 'agency_user' | 'engineer';
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_demo_user?: boolean;  // NEW: Flag for demo users
  agency?: {
    id: string;
    name: string;
    type: string;
    partnership_tier: string;
  };
}

interface UserSession {
  user_id: string;
  role: 'admin' | 'manager' | 'viewer' | 'engineer';
  agency_id: string | null;
  is_demo_user?: boolean;  // NEW: Flag for demo users
  email?: string;
  phone?: string;
}
```

### 3. Demo Detection Middleware (`lib/demo-data/middleware.ts`)

Helper functions for detecting demo users in API routes.

```typescript
interface DemoDetection {
  // Check if current session is a demo user
  isDemoUser(session: UserSession | null): boolean;
  
  // Get demo data or execute database query
  getDemoOrRealData<T>(
    session: UserSession | null,
    demoDataFn: () => T,
    realDataFn: () => Promise<T>
  ): Promise<T>;
}
```

### 4. Database Schema Extension

Add `is_demo_user` column to `agency_users` table:

```sql
ALTER TABLE agency_users 
ADD COLUMN is_demo_user BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_agency_users_demo 
ON agency_users(is_demo_user) 
WHERE is_demo_user = TRUE;
```

## Data Models

### Demo Earnings Data Structure

```typescript
interface DemoEarningsData {
  daily: {
    earnings: number;        // Range: 5000-25000
    jobs_completed: number;  // Range: 2-8
  };
  monthly: {
    earnings: number;        // Range: 150000-600000
    jobs_completed: number;  // Range: 50-200
  };
  yearly: {
    earnings: number;        // Range: 1800000-7200000
    jobs_completed: number;  // Range: 600-2400
  };
}
```

### Demo Dashboard Data Structure

```typescript
interface DemoDashboardData {
  summary: {
    total_jobs_completed: number;  // Range: 100-1000
    total_revenue: number;         // Range: 500000-5000000
    avg_rating: number;            // Range: 3.5-5.0
    total_engineers: number;       // Range: 10-50
    active_engineers: number;      // Range: 5-40
  };
  charts: {
    jobs_trend: Array<{
      month: string;
      completed: number;
      cancelled: number;
      total: number;
    }>;
    revenue_trend: Array<{
      month: string;
      revenue: number;
      avg_job_value: number;
    }>;
    rating_distribution: Array<{
      rating: number;
      count: number;
    }>;
    job_type_distribution: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  trends: {
    jobs_growth: number;      // Range: -20 to +30
    revenue_growth: number;   // Range: -15 to +35
    rating_change: number;    // Range: -0.3 to +0.3
  };
}
```

### Seeded Random Number Generator

```typescript
class SeededRandom {
  private seed: number;
  
  constructor(seed: string) {
    // Convert string seed to number
    this.seed = this.hashString(seed);
  }
  
  // Generate random number between 0 and 1
  next(): number;
  
  // Generate random integer between min and max (inclusive)
  nextInt(min: number, max: number): number;
  
  // Generate random float between min and max
  nextFloat(min: number, max: number): number;
  
  // Pick random element from array
  pick<T>(array: T[]): T;
  
  // Shuffle array deterministically
  shuffle<T>(array: T[]): T[];
}
```

## C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Demo user detection consistency
*For any* user session with `is_demo_user` flag set to true, all API endpoints should detect the user as a demo user and serve generated data instead of querying the database
**Validates: Requirements 1.1, 3.3, 3.4, 6.5**

### Property 2: Data structure completeness
*For any* generated demo data structure (earnings, dashboard, jobs, engineers), all required fields defined in the TypeScript interface should be present with values of the correct type
**Validates: Requirements 1.2, 2.4**

### Property 3: Numeric value realism
*For any* generated numeric value in demo data (earnings, job counts, ratings, engineer counts), the value should fall within the realistic range defined for that metric
**Validates: Requirements 1.2, 2.1, 4.1, 4.2**

### Property 4: Trend data bidirectionality
*For any* generated dashboard data, the trends object should contain at least one positive trend value and at least one negative trend value across multiple generations with different seeds
**Validates: Requirements 1.3**

### Property 5: Time-series completeness
*For any* requested time period, generated time-series data should contain data points spanning the full period with dates in chronological order
**Validates: Requirements 1.4, 2.5**

### Property 6: Deterministic generation
*For any* user ID, generating demo data multiple times should produce identical results every time
**Validates: Requirements 1.5, 5.1, 5.3, 5.4**

### Property 7: Collection variety
*For any* generated collection of items (jobs or engineers), the collection should contain at least two different values for categorical fields (job type, status, availability)
**Validates: Requirements 2.2, 2.3**

### Property 8: Session flag propagation
*For any* demo user account, loading the user session should include the `is_demo_user` flag set to true
**Validates: Requirements 3.2**

### Property 9: Write operation prevention
*For any* demo user session, attempting write operations (POST, PUT, DELETE) should be rejected or result in no database modifications
**Validates: Requirements 3.5**

### Property 10: Rating distribution constraints
*For any* generated rating value, the value should be between 3.5 and 5.0 inclusive
**Validates: Requirements 4.3**

### Property 11: Name format validity
*For any* generated engineer name, the string should be non-empty, contain only letters and spaces, and have length between 5 and 50 characters
**Validates: Requirements 4.4**

### Property 12: Timestamp recency
*For any* generated timestamp, the date should be within the last 365 days from the current date
**Validates: Requirements 4.5**

### Property 13: Seed-based uniqueness
*For any* two different user IDs, the generated demo data should be different
**Validates: Requirements 5.5**

## Error Handling

### Demo User Detection Errors

**Scenario:** Session data is malformed or missing
- **Handling:** Treat as non-demo user and proceed with normal database queries
- **Logging:** Log warning about malformed session data
- **User Impact:** No error shown to user; falls back to normal behavior

**Scenario:** Demo flag is present but has invalid value
- **Handling:** Treat as false (non-demo user)
- **Logging:** Log warning about invalid demo flag value
- **User Impact:** No error shown to user

### Data Generation Errors

**Scenario:** Invalid user ID provided to generator
- **Handling:** Use default seed value to generate data
- **Logging:** Log error with invalid user ID
- **User Impact:** Demo data is still generated and displayed

**Scenario:** Invalid period parameter for time-series data
- **Handling:** Default to 6 months period
- **Logging:** Log warning about invalid period
- **User Impact:** Data is generated for default period

**Scenario:** Random number generator produces out-of-range value
- **Handling:** Clamp value to valid range
- **Logging:** Log warning about clamping
- **User Impact:** Data is still valid and displayed

### Database Errors

**Scenario:** Failed to load demo user flag from database
- **Handling:** Treat as non-demo user
- **Logging:** Log error with database details
- **User Impact:** User sees real data or empty state if no real data exists

**Scenario:** Failed to persist demo user flag during user creation
- **Handling:** Return error to caller
- **Logging:** Log database error
- **User Impact:** User creation fails with error message

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

**Demo Data Generator Tests:**
- Test each generation function produces valid data structures
- Test seeded random number generator produces consistent output
- Test value ranges for all numeric fields
- Test date generation produces valid timestamps
- Test name generation produces valid strings
- Test edge cases (empty arrays, zero values, boundary conditions)

**Demo Detection Tests:**
- Test `isDemoUser` function with various session objects
- Test session flag extraction logic
- Test middleware routing logic
- Test flag persistence in database operations

**Data Structure Tests:**
- Test generated data matches TypeScript interfaces
- Test all required fields are present
- Test field types are correct
- Test nested object structures are valid

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using a PBT library (fast-check for TypeScript):

**Library:** fast-check (https://github.com/dubzzz/fast-check)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Tagging:** Each property-based test must include a comment tag in this exact format:
```typescript
// **Feature: dashboard-demo-data, Property {number}: {property_text}**
```

**Property Tests to Implement:**

1. **Deterministic Generation Property** (Property 6)
   - Generate: Random user IDs
   - Test: Calling generator twice with same ID produces identical output
   - Validates: Data consistency across sessions

2. **Numeric Bounds Property** (Property 3)
   - Generate: Random user IDs
   - Test: All numeric values in generated data fall within defined ranges
   - Validates: Realistic value constraints

3. **Data Structure Completeness Property** (Property 2)
   - Generate: Random user IDs
   - Test: Generated data has all required fields with correct types
   - Validates: Interface compliance

4. **Time-Series Ordering Property** (Property 5)
   - Generate: Random user IDs and time periods
   - Test: Generated time-series data is chronologically ordered
   - Validates: Temporal data correctness

5. **Collection Variety Property** (Property 7)
   - Generate: Random user IDs
   - Test: Generated collections contain multiple distinct values for categorical fields
   - Validates: Data diversity

6. **Seed Uniqueness Property** (Property 13)
   - Generate: Pairs of different user IDs
   - Test: Generated data for different IDs is different
   - Validates: User-specific data generation

7. **Rating Constraints Property** (Property 10)
   - Generate: Random user IDs
   - Test: All rating values are between 3.5 and 5.0
   - Validates: Rating realism

8. **Name Format Property** (Property 11)
   - Generate: Random user IDs
   - Test: All generated names match format requirements
   - Validates: Name validity

9. **Timestamp Recency Property** (Property 12)
   - Generate: Random user IDs
   - Test: All timestamps are within last 365 days
   - Validates: Date realism

### Integration Testing

Integration tests will verify the complete flow from API request to response:

**Demo User Flow Tests:**
- Test complete login flow for demo user
- Test dashboard data loading for demo user
- Test analytics page loading for demo user
- Test navigation between dashboard sections maintains consistency
- Test write operations are blocked for demo users

**API Endpoint Tests:**
- Test `/api/agencies/[id]/analytics` with demo user session
- Test `/api/agencies/[id]/earnings` with demo user session
- Test `/api/agencies/[id]/jobs` with demo user session
- Test `/api/agencies/[id]/engineers` with demo user session
- Verify all endpoints detect demo users correctly
- Verify all endpoints return generated data for demo users

**Database Integration Tests:**
- Test creating user with demo flag
- Test loading user session includes demo flag
- Test updating demo flag
- Test querying demo users

### Manual Testing Checklist

- [ ] Create demo user account via admin interface
- [ ] Log in as demo user and verify dashboard shows data
- [ ] Verify all overview cards display realistic values
- [ ] Verify charts render with multiple data points
- [ ] Navigate between dashboard sections and verify consistency
- [ ] Log out and log back in, verify same data appears
- [ ] Create second demo user and verify different data
- [ ] Attempt to modify data as demo user, verify blocked
- [ ] Verify demo user indicator appears in UI (if implemented)
- [ ] Test on different browsers and devices

## Implementation Notes

### Seeded Random Number Generation

The seeded random number generator is critical for deterministic data generation. Implementation should use a well-tested algorithm like Mulberry32 or xorshift:

```typescript
class SeededRandom {
  private state: number;
  
  constructor(seed: string) {
    // Hash string to number using simple hash function
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    this.state = Math.abs(hash);
  }
  
  next(): number {
    // Mulberry32 algorithm
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}
```

### Performance Considerations

- Demo data generation should complete in < 100ms for typical dashboard requests
- Cache generated data in memory for the duration of the request (not across requests)
- Avoid complex calculations; use simple formulas and lookup tables
- Generate only the data requested (don't generate unused fields)

### Security Considerations

- Demo users should never be able to access real user data
- Demo user flag should be checked on server-side only (never trust client)
- Write operations from demo users should be rejected at API level
- Demo user sessions should have same authentication requirements as real users
- Audit log should track demo user actions separately

### Backward Compatibility

- Existing users without `is_demo_user` flag should default to false (real users)
- Existing API endpoints should work unchanged for real users
- Demo data feature should be opt-in (requires explicit flag)
- No changes to existing database queries for real users

## Future Enhancements

### Phase 2 Enhancements (Not in Current Scope)

- **Demo Data Customization:** Allow admins to configure demo data parameters (value ranges, engineer count, etc.)
- **Demo Data Scenarios:** Pre-defined scenarios (high-performing agency, struggling agency, new agency)
- **Demo User UI Indicator:** Visual indicator in UI showing user is in demo mode
- **Demo Data Export:** Allow exporting demo data for presentations
- **Time Travel:** Allow demo users to see data "as of" different dates
- **Interactive Demo Mode:** Allow demo users to simulate actions and see results
- **Demo Data Reset:** Allow demo users to reset their demo data to initial state

### Technical Debt Considerations

- Consider moving to stored demo data if generation performance becomes an issue
- Consider adding demo data versioning if data structures change frequently
- Consider adding demo data validation layer to catch generation bugs
- Monitor demo user usage patterns to optimize generation algorithms
