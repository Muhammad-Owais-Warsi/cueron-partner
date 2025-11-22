/**
 * FCM Token Registration API
 * Handles device token registration and management
 * 
 * POST /api/fcm/register - Register or update FCM token
 * DELETE /api/fcm/register - Deactivate FCM token
 * 
 * Requirement 14.1: FCM token registration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Request validation schema
 */
const registerTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required'),
  device_type: z.enum(['ios', 'android'], {
    errorMap: () => ({ message: 'Device type must be ios or android' }),
  }),
  device_id: z.string().optional(),
});

/**
 * POST /api/fcm/register
 * Register or update FCM token for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
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

    // Parse and validate request body
    const body = await request.json();
    const validation = registerTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, device_type, device_id } = validation.data;

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('id, user_id')
      .eq('token', token)
      .single();

    if (existingToken) {
      // Token exists - update it
      if (existingToken.user_id !== user.id) {
        // Token belongs to different user - deactivate old and create new
        await supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .eq('token', token);

        const { data: newToken, error: insertError } = await supabase
          .from('fcm_tokens')
          .insert({
            user_id: user.id,
            token,
            device_type,
            device_id,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating FCM token:', insertError);
          return NextResponse.json(
            { error: 'Failed to register token' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          token: newToken,
          message: 'Token registered successfully',
        });
      } else {
        // Token belongs to same user - update it
        const { data: updatedToken, error: updateError } = await supabase
          .from('fcm_tokens')
          .update({
            device_type,
            device_id,
            is_active: true,
          })
          .eq('id', existingToken.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating FCM token:', updateError);
          return NextResponse.json(
            { error: 'Failed to update token' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          token: updatedToken,
          message: 'Token updated successfully',
        });
      }
    }

    // Token doesn't exist - create new
    const { data: newToken, error: insertError } = await supabase
      .from('fcm_tokens')
      .insert({
        user_id: user.id,
        token,
        device_type,
        device_id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating FCM token:', insertError);
      return NextResponse.json(
        { error: 'Failed to register token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: newToken,
      message: 'Token registered successfully',
    });
  } catch (error) {
    console.error('Error in FCM token registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fcm/register
 * Deactivate FCM token for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
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

    // Get token from query params or body
    const { searchParams } = new URL(request.url);
    const tokenFromQuery = searchParams.get('token');

    let token = tokenFromQuery;

    if (!token) {
      const body = await request.json();
      token = body.token;
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Deactivate token
    const { error: updateError } = await supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('token', token)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error deactivating FCM token:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token deactivated successfully',
    });
  } catch (error) {
    console.error('Error in FCM token deactivation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
