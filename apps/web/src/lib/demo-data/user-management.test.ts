/**
 * Unit tests for demo user management functions
 * Tests setting, unsetting, querying, and flag persistence
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@cueron/types';
import {
  setDemoUserFlag,
  unsetDemoUserFlag,
  queryDemoUsers,
  isDemoUserById,
} from './user-management';

// Test configuration
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

describe('Demo User Management', () => {
  let testUserId: string;
  let testAgencyId: string;
  let supabaseAvailable = false;
  const supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  beforeAll(async () => {
    try {
      // Test if Supabase is available
      const { error: testError } = await supabase
        .from('agencies')
        .select('id')
        .limit(1);

      if (testError) {
        console.warn('Supabase not available, skipping integration tests');
        return;
      }

      supabaseAvailable = true;

      // Create a test agency
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: 'Test Agency for Demo User Management',
          type: 'hvac',
          partnership_tier: 'standard',
        })
        .select()
        .single();

      if (agencyError) throw agencyError;
      testAgencyId = agency.id;

      // Create a test user in auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: `test-demo-user-${Date.now()}@example.com`,
          password: 'test-password-123',
          email_confirm: true,
        });

      if (authError) throw authError;
      testUserId = authData.user.id;

      // Create agency_users record
      const { error: agencyUserError } = await supabase
        .from('agency_users')
        .insert({
          user_id: testUserId,
          agency_id: testAgencyId,
          role: 'manager',
          is_demo_user: false,
        });

      if (agencyUserError) throw agencyUserError;
    } catch (error) {
      console.warn('Failed to set up test data:', error);
      supabaseAvailable = false;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (supabaseAvailable) {
      if (testUserId) {
        await supabase.from('agency_users').delete().eq('user_id', testUserId);
        await supabase.auth.admin.deleteUser(testUserId);
      }
      if (testAgencyId) {
        await supabase.from('agencies').delete().eq('id', testAgencyId);
      }
    }
  });

  it('should set demo flag for a user', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }
    const result = await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify the flag was set
    const { data } = await supabase
      .from('agency_users')
      .select('is_demo_user')
      .eq('user_id', testUserId)
      .single();

    expect(data?.is_demo_user).toBe(true);
  });

  it('should unset demo flag for a user', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    // First set the flag
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    // Then unset it
    const result = await unsetDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify the flag was unset
    const { data } = await supabase
      .from('agency_users')
      .select('is_demo_user')
      .eq('user_id', testUserId)
      .single();

    expect(data?.is_demo_user).toBe(false);
  });

  it('should query all demo users', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    // Set the test user as demo
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    const result = await queryDemoUsers(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    expect(result.success).toBe(true);
    expect(result.userIds).toBeDefined();
    expect(Array.isArray(result.userIds)).toBe(true);
    expect(result.userIds).toContain(testUserId);
  });

  it('should check if a user is a demo user', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    // Set the test user as demo
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    const result = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.isDemo).toBe(true);
  });

  it('should persist demo flag across multiple queries', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    // Set the flag
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    // Query multiple times
    const result1 = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    const result2 = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    const result3 = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );

    expect(result1.isDemo).toBe(true);
    expect(result2.isDemo).toBe(true);
    expect(result3.isDemo).toBe(true);
  });

  it('should handle non-existent user gracefully', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    const fakeUserId = '00000000-0000-0000-0000-000000000000';

    const result = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      fakeUserId
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should toggle demo flag multiple times', async () => {
    if (!supabaseAvailable) {
      console.log('Skipping test - Supabase not available');
      return;
    }

    // Set to true
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    let result = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    expect(result.isDemo).toBe(true);

    // Set to false
    await unsetDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    result = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    expect(result.isDemo).toBe(false);

    // Set to true again
    await setDemoUserFlag(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    result = await isDemoUserById(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      testUserId
    );
    expect(result.isDemo).toBe(true);
  });
});
