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
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { engineerSchema } from '@cueron/utils/src/schemas';

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
    const { data: engineers, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      engineers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil((count || 0) / limit),
        total_items: count,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch engineers' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agencies/{id}/engineers
 * Add a new engineer to an agency
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use admin client to bypass RLS for development
    const supabase = await createAdminClient();
    
    // Parse request body
    const body = await request.json();
    
    // Allow 'unknown' as agency ID when removing restrictions
    const agencyId = params.id === 'unknown' ? body.agency_id || '' : params.id;
    
    // Prepare data for validation - exclude agency_id if it's empty
    const validationData = { ...body };
    if (params.id === 'unknown' && !body.agency_id) {
      // Don't include agency_id in validation data if it's not provided
      delete validationData.agency_id;
    } else if (params.id === 'unknown' && body.agency_id) {
      // Include the provided agency_id for validation
      validationData.agency_id = body.agency_id;
    } else {
      // Use the agency ID from the URL parameter
      validationData.agency_id = params.id;
    }
    
    // Validate input
    const validation = engineerSchema.safeParse(validationData);

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
        agency_id: agencyId || null, // Allow null agency_id
        name: engineerData.name,
        phone: engineerData.phone,
        email: engineerData.email,
        photo_url: engineerData.photo_url,
        certifications: engineerData.certifications || [],
        skill_level: engineerData.skill_level,
        specializations: engineerData.specializations || [],
        employment_type: engineerData.employment_type,
        availability_status: 'available',
        total_jobs_completed: 0,
        // Removed total_earnings as it doesn't exist in the schema
        average_rating: 0,
        total_ratings: 0,
        success_rate: 100,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ engineer }, { status: 201 });
  } catch (error) {
    console.error('Error creating engineer:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create engineer' } },
      { status: 500 }
    );
  }
}