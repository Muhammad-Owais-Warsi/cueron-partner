/**
 * Engineer Management API Route
 * GET /api/engineers/{id} - Get engineer details
 * PATCH /api/engineers/{id} - Update engineer information
 * 
 * Handles individual engineer operations including profile updates
 * and availability status changes.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateEngineerInput } from '@cueron/types';

/**
 * GET /api/engineers/{id}
 * Get engineer details by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: engineer, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !engineer) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Engineer not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ engineer });
  } catch (error) {
    console.error('Unexpected error in GET /api/engineers/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/engineers/{id}
 * Update engineer information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body: UpdateEngineerInput = await request.json();

    // If phone is being updated, check uniqueness
    if (body.phone) {
      const { data: existingEngineer } = await supabase
        .from('engineers')
        .select('id')
        .eq('phone', body.phone)
        .neq('id', params.id)
        .single();

      if (existingEngineer) {
        return NextResponse.json(
          {
            error: {
              code: 'DUPLICATE_PHONE',
              message: 'An engineer with this phone number already exists'
            }
          },
          { status: 409 }
        );
      }
    }

    // Update engineer
    const { data: engineer, error } = await supabase
      .from('engineers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error || !engineer) {
      console.error('Error updating engineer:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update engineer' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ engineer });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/engineers/[id]:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
