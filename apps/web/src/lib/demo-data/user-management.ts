/**
 * Demo User Management Module
 * Provides functions to manage demo user flags in the database
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Set the demo user flag for a specific user
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase service role key (required for admin operations)
 * @param userId - The user ID to mark as demo user
 * @returns Promise resolving to success status
 */
export async function setDemoUserFlag(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('agency_users')
      .update({ is_demo_user: true })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unset the demo user flag for a specific user
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase service role key (required for admin operations)
 * @param userId - The user ID to unmark as demo user
 * @returns Promise resolving to success status
 */
export async function unsetDemoUserFlag(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('agency_users')
      .update({ is_demo_user: false })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Query all demo users
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase service role key (required for admin operations)
 * @returns Promise resolving to list of demo user IDs
 */
export async function queryDemoUsers(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ success: boolean; userIds?: string[]; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('agency_users')
      .select('user_id')
      .eq('is_demo_user', true);

    if (error) {
      return { success: false, error: error.message };
    }

    const userIds = data?.map((row) => row.user_id) ?? [];
    return { success: true, userIds };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a specific user is a demo user
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase service role key (required for admin operations)
 * @param userId - The user ID to check
 * @returns Promise resolving to demo user status
 */
export async function isDemoUserById(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<{ success: boolean; isDemo?: boolean; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('agency_users')
      .select('is_demo_user')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, isDemo: data.is_demo_user ?? false };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
