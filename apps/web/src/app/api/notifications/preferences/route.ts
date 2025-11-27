/**
 * Notification Preferences API
 * GET /api/notifications/preferences - Get user notification preferences
 * PUT /api/notifications/preferences - Update user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          user_id: user.id,
          enable_push: true,
          enable_email: true,
          enable_sms: false,
          notification_types: {
            job_assigned: true,
            job_accepted: true,
            job_status_update: true,
            job_completed: true,
            payment_received: true,
            payment_pending: true,
            engineer_added: true,
            agency_approved: true,
            system_alert: true,
          },
        },
      });
    }

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    console.error('Unexpected error in notification preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    if (typeof body.enable_push !== 'boolean' &&
        typeof body.enable_email !== 'boolean' &&
        typeof body.enable_sms !== 'boolean' &&
        !body.notification_types) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingPreferences) {
      // Update existing preferences
      const updateData: any = {};
      if (typeof body.enable_push === 'boolean') {
        updateData.enable_push = body.enable_push;
      }
      if (typeof body.enable_email === 'boolean') {
        updateData.enable_email = body.enable_email;
      }
      if (typeof body.enable_sms === 'boolean') {
        updateData.enable_sms = body.enable_sms;
      }
      if (body.notification_types) {
        updateData.notification_types = body.notification_types;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification preferences:', error);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          enable_push: body.enable_push ?? true,
          enable_email: body.enable_email ?? true,
          enable_sms: body.enable_sms ?? false,
          notification_types: body.notification_types ?? {
            job_assigned: true,
            job_accepted: true,
            job_status_update: true,
            job_completed: true,
            payment_received: true,
            payment_pending: true,
            engineer_added: true,
            agency_approved: true,
            system_alert: true,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification preferences:', error);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      preferences: result,
    });
  } catch (error) {
    console.error('Unexpected error in notification preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
