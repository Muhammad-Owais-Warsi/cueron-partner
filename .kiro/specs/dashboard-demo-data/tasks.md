# Implementation Plan

- [x] 1. Set up database schema and types for demo user flag





  - Add `is_demo_user` column to `agency_users` table via migration
  - Create database index for demo user queries
  - Update TypeScript types to include `is_demo_user` flag in UserProfile and UserSession interfaces
  - _Requirements: 3.1, 3.2, 6.2_

- [x] 2. Implement seeded random number generator





  - Create `SeededRandom` class with Mulberry32 algorithm
  - Implement `next()`, `nextInt()`, `nextFloat()`, `pick()`, and `shuffle()` methods
  - Add string hashing function to convert user IDs to numeric seeds
  - _Requirements: 5.2_

- [x] 2.1 Write property test for seeded random generator







  - **Property 6: Deterministic generation**
  - **Validates: Requirements 5.1**
-

- [x] 3. Create demo data generator utility




  - Create `lib/demo-data/generator.ts` module
  - Implement `generateEarnings()` function with realistic value ranges
  - Implement `generateDashboardData()` function with summary, charts, and trends
  - Implement `generateMonthlyMetrics()` for time-series chart data
  - Implement `generateJobs()` function with varied job types and statuses
  - Implement `generateEngineers()` function with varied performance metrics
  - Use SeededRandom for all random value generation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_
-

- [x] 3.1 Write property test for deterministic generation






  - **Property 6: Deterministic generation**
  - **Validates: Requirements 1.5, 5.1**

- [x] 3.2 Write property test for numeric bounds






  - **Property 3: Numeric value realism**
  - **Validates: Requirements 1.2, 2.1, 4.1, 4.2**

- [x] 3.3 Write property test for data structure completeness


  - **Property 2: Data structure completeness**
  - **Validates: Requirements 1.2, 2.4**

- [x] 3.4 Write property test for time-series ordering


  - **Property 5: Time-series completeness**
  - **Validates: Requirements 1.4, 2.5**

- [x] 3.5 Write property test for collection variety


  - **Property 7: Collection variety**
  - **Validates: Requirements 2.2, 2.3**

- [x] 3.6 Write property test for seed uniqueness


  - **Property 13: Seed-based uniqueness**
  - **Validates: Requirements 5.5**

- [x] 3.7 Write property test for rating constraints


  - **Property 10: Rating distribution constraints**
  - **Validates: Requirements 4.3**

- [x] 3.8 Write property test for name format


  - **Property 11: Name format validity**
  - **Validates: Requirements 4.4**

- [x] 3.9 Write property test for timestamp recency


  - **Property 12: Timestamp recency**
  - **Validates: Requirements 4.5**
- [x] 4. Create demo detection middleware







- [ ] 4. Create demo detection middleware

  - Create `lib/demo-data/middleware.ts` module
  - Implement `isDemoUser()` function to check session flag
  - Implement `getDemoOrRealData()` helper for conditional data routing
  - Add error handling for malformed session data
  - _Requirements: 3.3, 3.4_

- [x] 4.1 Write property test for demo user detection



  - **Property 1: Demo user detection consistency**
  - **Validates: Requirements 1.1, 3.3, 3.4**
-

- [x] 5. Update authentication system to load demo flag




  - Modify `getUserSession()` in `lib/auth/server.ts` to query `is_demo_user` flag
  - Update session object to include `is_demo_user` field
  - Modify `useUserProfile()` hook to include `is_demo_user` in profile
  - Add fallback handling if flag is missing (default to false)
  - _Requirements: 3.2_

- [x] 5.1 Write property test for session flag propagation


  - **Property 8: Session flag propagation**
  - **Validates: Requirements 3.2**

- [x] 6. Integrate demo data into analytics API endpoint





  - Modify `/api/agencies/[id]/analytics/route.ts` to detect demo users
  - Add conditional logic to serve generated data for demo users
  - Ensure generated data matches existing response format exactly
  - Test with demo user session to verify data is served correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
-

- [x] 7. Integrate demo data into earnings API endpoint




  - Modify `/api/agencies/[id]/earnings/route.ts` to detect demo users
  - Add conditional logic to serve generated earnings data
  - Ensure generated data matches EarningsData interface
  - Test with demo user session
  - _Requirements: 1.1, 2.1_
- [x] 8. Integrate demo data into jobs API endpoint




- [ ] 8. Integrate demo data into jobs API endpoint

  - Modify `/api/agencies/[id]/jobs/route.ts` to detect demo users
  - Add conditional logic to serve generated job list
  - Ensure pagination parameters are respected
  - Test with demo user session
  - _Requirements: 1.1, 2.2_

- [x] 9. Integrate demo data into engineers API endpoint





  - Modify `/api/agencies/[id]/engineers/route.ts` to detect demo users
  - Add conditional logic to serve generated engineer list
  - Ensure status filters are respected
  - Test with demo user session
  - _Requirements: 1.1, 2.3_

- [x] 9.1 Write integration tests for demo data API endpoints


  - Test analytics endpoint with demo user
  - Test earnings endpoint with demo user
  - Test jobs endpoint with demo user
  - Test engineers endpoint with demo user
  - Verify consistency across multiple requests
  - _Requirements: 1.1, 1.5, 6.5_

- [x] 10. Implement write operation prevention for demo users





  - Add demo user check to all POST/PUT/DELETE endpoints
  - Return 403 Forbidden error for demo users attempting writes
  - Add appropriate error messages
  - Test write prevention across all endpoints
  - _Requirements: 3.5_

- [x] 10.1 Write property test for write operation prevention


  - **Property 9: Write operation prevention**
  - **Validates: Requirements 3.5**
-

- [x] 11. Add demo user management functionality




  - Create utility script or admin function to mark users as demo users
  - Add database query to set `is_demo_user` flag
  - Add database query to unset `is_demo_user` flag
  - Document how to create demo users
  - _Requirements: 6.1, 6.4_

- [x] 11.1 Write unit tests for demo user management


  - Test setting demo flag
  - Test unsetting demo flag
  - Test querying demo users
  - Test flag persistence
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 12. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 13. Update documentation




  - Add README for demo data feature
  - Document how to create demo users
  - Document demo data generation logic
  - Add code comments to key functions
  - _Requirements: All_

- [x] 14. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
