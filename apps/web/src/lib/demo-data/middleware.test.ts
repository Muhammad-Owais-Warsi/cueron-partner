/**
 * Property-Based Tests for Demo Detection Middleware
 * 
 * These tests verify that demo user detection works consistently across
 * a wide range of session configurations and edge cases.
 */

import * as fc from 'fast-check';
import { isDemoUser, getDemoOrRealData, preventDemoUserWrites } from './middleware';
import type { UserSession } from '../auth/server';

describe('Demo Detection Middleware', () => {
  describe('Property Tests', () => {
    // **Feature: dashboard-demo-data, Property 1: Demo user detection consistency**
    // **Validates: Requirements 1.1, 3.3, 3.4**
    it('should consistently detect demo users with is_demo_user flag set to true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.option(fc.emailAddress(), { nil: undefined }),
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          (userId, role, agencyId, email, phone) => {
            // Create session with is_demo_user = true
            const demoSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: true,
              email,
              phone,
            };

            // Should always detect as demo user
            return isDemoUser(demoSession) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently detect non-demo users with is_demo_user flag set to false', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.option(fc.emailAddress(), { nil: undefined }),
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          (userId, role, agencyId, email, phone) => {
            // Create session with is_demo_user = false
            const realSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: false,
              email,
              phone,
            };

            // Should always detect as non-demo user
            return isDemoUser(realSession) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat missing is_demo_user flag as non-demo user', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          (userId, role, agencyId) => {
            // Create session without is_demo_user flag
            const session: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              // is_demo_user is undefined
            };

            // Should default to non-demo user
            return isDemoUser(session) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for null session', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          return isDemoUser(null) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should route to demo data function for demo users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.integer(),
          async (userId, role, agencyId, demoValue) => {
            const demoSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: true,
            };

            let demoFnCalled = false;
            let realFnCalled = false;

            const result = await getDemoOrRealData(
              demoSession,
              () => {
                demoFnCalled = true;
                return demoValue;
              },
              async () => {
                realFnCalled = true;
                return demoValue + 1000;
              }
            );

            // Demo function should be called, real function should not
            // Result should be from demo function
            return demoFnCalled && !realFnCalled && result === demoValue;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should route to real data function for non-demo users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.integer(),
          async (userId, role, agencyId, realValue) => {
            const realSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: false,
            };

            let demoFnCalled = false;
            let realFnCalled = false;

            const result = await getDemoOrRealData(
              realSession,
              () => {
                demoFnCalled = true;
                return realValue - 1000;
              },
              async () => {
                realFnCalled = true;
                return realValue;
              }
            );

            // Real function should be called, demo function should not
            // Result should be from real function
            return !demoFnCalled && realFnCalled && result === realValue;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should route to real data function for null session', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (realValue) => {
          let demoFnCalled = false;
          let realFnCalled = false;

          const result = await getDemoOrRealData(
            null,
            () => {
              demoFnCalled = true;
              return realValue - 1000;
            },
            async () => {
              realFnCalled = true;
              return realValue;
            }
          );

          // Real function should be called, demo function should not
          // Result should be from real function
          return !demoFnCalled && realFnCalled && result === realValue;
        }),
        { numRuns: 100 }
      );
    });

    it('should fallback to real data if demo data generation throws error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.integer(),
          async (userId, role, agencyId, realValue) => {
            const demoSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: true,
            };

            let realFnCalled = false;

            const result = await getDemoOrRealData(
              demoSession,
              () => {
                throw new Error('Demo data generation failed');
              },
              async () => {
                realFnCalled = true;
                return realValue;
              }
            );

            // Should fallback to real function and return real value
            return realFnCalled && result === realValue;
          }
        ),
        { numRuns: 100 }
      );
    });

    // **Feature: dashboard-demo-data, Property 9: Write operation prevention**
    // **Validates: Requirements 3.5**
    it('should prevent write operations for all demo users', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.option(fc.emailAddress(), { nil: undefined }),
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          (userId, role, agencyId, email, phone) => {
            // Create demo user session
            const demoSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: true,
              email,
              phone,
            };

            // Attempt write operation
            const response = preventDemoUserWrites(demoSession);

            // Should return error response
            if (!response) return false;

            // Check response status is 403
            if (response.status !== 403) return false;

            // Response should be a NextResponse
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow write operations for all non-demo users', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          fc.option(fc.emailAddress(), { nil: undefined }),
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          (userId, role, agencyId, email, phone) => {
            // Create non-demo user session
            const realSession: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              is_demo_user: false,
              email,
              phone,
            };

            // Attempt write operation
            const response = preventDemoUserWrites(realSession);

            // Should return null (no error)
            return response === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow write operations for null session', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const response = preventDemoUserWrites(null);
          // Should return null (no error) - let auth middleware handle it
          return response === null;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow write operations for sessions with missing demo flag', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.constant('admin' as const),
            fc.constant('manager' as const),
            fc.constant('viewer' as const),
            fc.constant('engineer' as const)
          ),
          fc.option(fc.string({ minLength: 1 }), { nil: null }),
          (userId, role, agencyId) => {
            // Create session without is_demo_user flag
            const session: UserSession = {
              user_id: userId,
              role,
              agency_id: agencyId,
              // is_demo_user is undefined
            };

            // Attempt write operation
            const response = preventDemoUserWrites(session);

            // Should return null (no error) - defaults to non-demo
            return response === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should handle invalid is_demo_user flag types', () => {
      const invalidSession = {
        user_id: 'test-user',
        role: 'admin' as const,
        agency_id: 'test-agency',
        is_demo_user: 'true' as any, // Invalid: string instead of boolean
      };

      expect(isDemoUser(invalidSession)).toBe(false);
    });

    it('should handle is_demo_user as null', () => {
      const session = {
        user_id: 'test-user',
        role: 'admin' as const,
        agency_id: 'test-agency',
        is_demo_user: null as any,
      };

      expect(isDemoUser(session)).toBe(false);
    });

    it('should handle is_demo_user as number', () => {
      const session = {
        user_id: 'test-user',
        role: 'admin' as const,
        agency_id: 'test-agency',
        is_demo_user: 1 as any, // Invalid: number instead of boolean
      };

      expect(isDemoUser(session)).toBe(false);
    });

    it('should preserve data types through getDemoOrRealData', async () => {
      const demoSession: UserSession = {
        user_id: 'demo-user',
        role: 'admin',
        agency_id: 'demo-agency',
        is_demo_user: true,
      };

      const complexData = {
        id: 123,
        name: 'Test',
        values: [1, 2, 3],
        nested: { key: 'value' },
      };

      const result = await getDemoOrRealData(
        demoSession,
        () => complexData,
        async () => ({ id: 456, name: 'Real', values: [], nested: {} })
      );

      expect(result).toEqual(complexData);
    });

    it('should handle async real data function errors', async () => {
      const realSession: UserSession = {
        user_id: 'real-user',
        role: 'admin',
        agency_id: 'real-agency',
        is_demo_user: false,
      };

      await expect(
        getDemoOrRealData(
          realSession,
          () => 'demo-data',
          async () => {
            throw new Error('Database error');
          }
        )
      ).rejects.toThrow('Database error');
    });

    it('should return 403 response with correct error structure for demo users', () => {
      const demoSession: UserSession = {
        user_id: 'demo-user',
        role: 'admin',
        agency_id: 'demo-agency',
        is_demo_user: true,
      };

      const response = preventDemoUserWrites(demoSession);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return null for non-demo users', () => {
      const realSession: UserSession = {
        user_id: 'real-user',
        role: 'admin',
        agency_id: 'real-agency',
        is_demo_user: false,
      };

      const response = preventDemoUserWrites(realSession);

      expect(response).toBeNull();
    });

    it('should return null for null session', () => {
      const response = preventDemoUserWrites(null);
      expect(response).toBeNull();
    });

    it('should return null for session with missing demo flag', () => {
      const session: UserSession = {
        user_id: 'user',
        role: 'admin',
        agency_id: 'agency',
      };

      const response = preventDemoUserWrites(session);
      expect(response).toBeNull();
    });
  });
});
