import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for location update
const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * PATCH /api/engineers/[id]/location
 * 
 * Updates an engineer's current location with PostGIS POINT storage
 * and records the timestamp of the update.
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5
 * 
 * @param request - Contains latitude and longitude in the body
 * @param params - Contains engineer id
 * @returns Updated engineer location data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const engineerId = params.id;

    // Authenticate the request
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = locationUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid location data',
            details: validationResult.error.flatten().fieldErrors,
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    const { latitude, longitude } = validationResult.data;

    // Verify the engineer exists and belongs to the authenticated user
    const { data: engineer, error: engineerError } = await supabase
      .from('engineers')
      .select('id, user_id, availability_status')
      .eq('id', engineerId)
      .single();

    if (engineerError || !engineer) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Engineer not found',
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    // Verify the engineer belongs to the authenticated user
    if (engineer.user_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this engineer location',
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
    }

    // Update location using PostGIS POINT format
    // PostGIS uses (longitude, latitude) order, not (latitude, longitude)
    const { data: updatedEngineer, error: updateError } = await supabase
      .from('engineers')
      .update({
        current_location: `POINT(${longitude} ${latitude})`,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', engineerId)
      .select('id, current_location, last_location_update, availability_status')
      .single();

    if (updateError) {
      console.error('Location update error:', updateError);
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update location',
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID(),
          },
        },
        { status: 500 }
      );
    }

    // Broadcast location update to realtime channels
    // Requirement 6.4: Real-time location update broadcasting
    // The database trigger will handle broadcasting to agency and job channels
    // We can also explicitly broadcast to the engineer's active job
    if (engineer.availability_status === 'on_job') {
      // Find the active job for this engineer
      const { data: activeJob } = await supabase
        .from('jobs')
        .select('id, assigned_agency_id')
        .eq('assigned_engineer_id', engineerId)
        .in('status', ['accepted', 'travelling', 'onsite'])
        .single();

      if (activeJob) {
        // Broadcast to job channel
        const jobChannel = supabase.channel(`job:${activeJob.id}`);
        await jobChannel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            engineer_id: engineerId,
            location: {
              lat: latitude,
              lng: longitude,
            },
            timestamp: updatedEngineer.last_location_update,
          },
        });

        // Broadcast to agency channel
        if (activeJob.assigned_agency_id) {
          const agencyChannel = supabase.channel(`agency:${activeJob.assigned_agency_id}`);
          await agencyChannel.send({
            type: 'broadcast',
            event: 'engineer_location_updated',
            payload: {
              engineer_id: engineerId,
              job_id: activeJob.id,
              location: {
                lat: latitude,
                lng: longitude,
              },
              timestamp: updatedEngineer.last_location_update,
            },
          });
        }
      }
    }

    return NextResponse.json({
      data: {
        id: updatedEngineer.id,
        current_location: updatedEngineer.current_location,
        last_location_update: updatedEngineer.last_location_update,
        availability_status: updatedEngineer.availability_status,
      },
    });
  } catch (error) {
    console.error('Unexpected error in location update:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
