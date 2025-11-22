/**
 * Agency Engineers Management API Route
 * GET /api/agencies/{id}/engineers - List engineers for an agency
 * POST /api/agencies/{id}/engineers - Add a new engineer to an agency
 * 
 * Handles engineer listing with filtering and pagination,
 * and engineer creation with validation.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { engineerSchema } from '@cueron/utils/src/schemas';
import type { Engineer, CreateEngineerInput } from '@cueron/types';

/**
 * GET /api/agencies/{id}/engineers
 * List all engineers for a specific agency with optional filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('engineers')
      .select('*', { count: 'exact' })
      .eq('agency_id', params.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('availability_status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: engineers, error, count } = await query;

    if (error) {
      console.error('Error fetching engineers:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch engineers' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      engineers: engineers || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/engineers:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agencies/{id}/engineers
 * Create a new engineer for the agency
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate input
    const validation = engineerSchema.safeParse({
      ...body,
      agency_id: params.id
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid engineer data',
            details: validation.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      );
    }

    const engineerData = validation.data;

    // Check phone uniqueness
    const { data: existingEngineer } = await supabase
      .from('engineers')
      .select('id')
      .eq('phone', engineerData.phone)
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

    // Create engineer with default values
    const { data: engineer, error } = await supabase
      .from('engineers')
      .insert({
        agency_id: params.id,
        name: engineerData.name,
        phone: engineerData.phone,
        email: engineerData.email,
        photo_url: engineerData.photo_url,
        certifications: engineerData.certifications || [],
        skill_level: engineerData.skill_level,
        specializations: engineerData.specializations || [],
        employment_type: engineerData.employment_type,
        availability_status: 'available', // Default status
        total_jobs_completed: 0,
        average_rating: 0,
        total_ratings: 0,
        success_rate: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating engineer:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create engineer' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ engineer }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/agencies/[id]/engineers:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
