/**
 * Property-Based Tests for Authentication Server Module
 * Tests session flag propagation for demo users
 */

import * as fc from 'fast-check';
import { getUserSession } from './server';

// Mock the Supabase client
jest.mock('../supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Authentication Server - Session Flag Propagation', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    // Mock the createClient function to return our mock client
    const { createClient } = require('../supabase/server');
    createClient.mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    // **Feature: dashboard-demo-data, Property 8: Session flag propagation**
    // **Validates: Requirements 3.2**
    it('should include is_demo_user flag set to true for demo user accounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // user_id
          fc.constantFrom('admin', 'manager', 'viewer'), // role
          fc.string({ minLength: 10, maxLength: 50 }), // agency_id
          fc.emailAddress(), // email
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }), // phone
          async (userId, role, agencyId, email, phone) => {
            // Mock authenticated user
            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email,
                  phone,
                },
              },
              error: null,
            });

            // Mock agency_users query with is_demo_user = true
            const mockFrom = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  role,
                  agency_id: agencyId,
                  is_demo_user: true, // Demo user flag set to true
                },
                error: null,
              }),
            };
            mockSupabaseClient.from.mockReturnValue(mockFrom);

            // Call getUserSession
            const session = await getUserSession();

            // Verify session includes is_demo_user flag set to true
            expect(session).not.toBeNull();
            expect(session?.is_demo_user).toBe(true);
            expect(session?.user_id).toBe(userId);
            expect(session?.role).toBe(role);
            expect(session?.agency_id).toBe(agencyId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include is_demo_user flag set to false for non-demo user accounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // user_id
          fc.constantFrom('admin', 'manager', 'viewer'), // role
          fc.string({ minLength: 10, maxLength: 50 }), // agency_id
          fc.emailAddress(), // email
          fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }), // phone
          async (userId, role, agencyId, email, phone) => {
            // Mock authenticated user
            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email,
                  phone,
                },
              },
              error: null,
            });

            // Mock agency_users query with is_demo_user = false
            const mockFrom = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  role,
                  agency_id: agencyId,
                  is_demo_user: false, // Demo user flag set to false
                },
                error: null,
              }),
            };
            mockSupabaseClient.from.mockReturnValue(mockFrom);

            // Call getUserSession
            const session = await getUserSession();

            // Verify session includes is_demo_user flag set to false
            expect(session).not.toBeNull();
            expect(session?.is_demo_user).toBe(false);
            expect(session?.user_id).toBe(userId);
            expect(session?.role).toBe(role);
            expect(session?.agency_id).toBe(agencyId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default is_demo_user to false when flag is missing from database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // user_id
          fc.constantFrom('admin', 'manager', 'viewer'), // role
          fc.string({ minLength: 10, maxLength: 50 }), // agency_id
          fc.emailAddress(), // email
          async (userId, role, agencyId, email) => {
            // Mock authenticated user
            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email,
                },
              },
              error: null,
            });

            // Mock agency_users query WITHOUT is_demo_user field
            const mockFrom = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  role,
                  agency_id: agencyId,
                  // is_demo_user is missing (undefined)
                },
                error: null,
              }),
            };
            mockSupabaseClient.from.mockReturnValue(mockFrom);

            // Call getUserSession
            const session = await getUserSession();

            // Verify session defaults is_demo_user to false
            expect(session).not.toBeNull();
            expect(session?.is_demo_user).toBe(false);
            expect(session?.user_id).toBe(userId);
            expect(session?.role).toBe(role);
            expect(session?.agency_id).toBe(agencyId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default is_demo_user to false for engineer accounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }), // user_id
          fc.string({ minLength: 10, maxLength: 50 }), // engineer_id
          fc.string({ minLength: 10, maxLength: 50 }), // agency_id
          fc.emailAddress(), // email
          async (userId, engineerId, agencyId, email) => {
            // Mock authenticated user
            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email,
                },
              },
              error: null,
            });

            // Mock agency_users query returning null (no agency user record)
            // Then mock engineers query returning engineer data
            let callCount = 0;
            mockSupabaseClient.from.mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: agency_users table
                return {
                  select: jest.fn().mockReturnThis(),
                  eq: jest.fn().mockReturnThis(),
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null, // No agency_users record
                    error: null,
                  }),
                };
              } else {
                // Second call: engineers table
                return {
                  select: jest.fn().mockReturnThis(),
                  eq: jest.fn().mockReturnThis(),
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: {
                      id: engineerId,
                      agency_id: agencyId,
                    },
                    error: null,
                  }),
                };
              }
            });

            // Call getUserSession
            const session = await getUserSession();

            // Verify session defaults is_demo_user to false for engineers
            expect(session).not.toBeNull();
            expect(session?.is_demo_user).toBe(false);
            expect(session?.user_id).toBe(userId);
            expect(session?.role).toBe('engineer');
            expect(session?.agency_id).toBe(agencyId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should handle null is_demo_user value by defaulting to false', async () => {
      const userId = 'test-user-123';
      const role = 'admin';
      const agencyId = 'test-agency-456';

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock agency_users query with is_demo_user = null
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            role,
            agency_id: agencyId,
            is_demo_user: null, // Explicitly null
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Call getUserSession
      const session = await getUserSession();

      // Verify session defaults is_demo_user to false
      expect(session).not.toBeNull();
      expect(session?.is_demo_user).toBe(false);
    });

    it('should return null when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      // Call getUserSession
      const session = await getUserSession();

      // Verify session is null
      expect(session).toBeNull();
    });

    it('should return null when database query fails', async () => {
      const userId = 'test-user-123';

      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock agency_users query with error
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockFrom);

      // Call getUserSession
      const session = await getUserSession();

      // Verify session is null
      expect(session).toBeNull();
    });
  });
});
