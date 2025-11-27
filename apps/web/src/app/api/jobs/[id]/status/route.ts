/**
 * Job Status Management API Route
 * PATCH /api/jobs/{id}/status - Update job status with history tracking
 * 
 * Implements status history recording with location, status transition validation,
 * timestamp recording for each status, and Supabase Realtime broadcast for status changes.
 * 
 * Requirements: 6.1, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils/src/authorization';
import type { JobStatus } from '@cueron/types/src/database';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Valid status transitions
 * Defines which status changes are allowed
 */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['accepted', 'cancelled'],
  accepted: ['travelling', 'cancelled'],
  travelling: ['onsite', 'cancelled'],
  onsite: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Validate status transition
 * Ensures status changes follow valid workflow
 */
function validateStatusTransition(
  currentStatus: JobStatus,
  newStatus: JobStatus
): { valid: boolean; error?: string } {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Get timestamp field name for status
 * Maps status to corresponding timestamp field in jobs table
 */
function getTimestampFieldForStatus(status: JobStatus): string | null {
  const timestampMap: Record<string, string> = {
    assigned: 'assigned_at',
    accepted: 'accepted_at',
    onsite: 'started_at',
    completed: 'completed_at',
  };
  
  return timestampMap[status] || null;
}

/**
 * PATCH /api/jobs/{id}/status
 * Update job status with history tracking and real-time broadcast
 * 
 * Requirements:
 * - 6.1: Record status change with timestamp and engineer location
 * - 6.3: Record arrival time when status changes to 'onsite'
 * - 6.4: Broadcast status changes via Supabase Realtime
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return errorResponse(
        'INVALID_ID',
        'Invalid job ID format',
        undefined,
        400
      );
    }

    // Get authenticated user session
    const session = await getUserSession();
    
    if (!session) {
      return errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        undefined,
        401
      );
    }

    // Parse request body first (before permission check)
    const body = await request.json();
    const { status: newStatus, location, notes } = body;

    // Validate required fields
    if (!newStatus) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required field',
        { status: ['Status is required'] }
      );
    }

    // Validate status value
    const validStatuses: JobStatus[] = [
      'pending',
      'assigned',
      'accepted',
      'travelling',
      'onsite',
      'completed',
      'cancelled',
    ];
    
    if (!validStatuses.includes(newStatus)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: [`Status must be one of: ${validStatuses.join(', ')}`] }
      );
    }

    // Validate location format if provided
    if (location) {
      if (
        typeof location.lat !== 'number' ||
        typeof location.lng !== 'number' ||
        location.lat < -90 ||
        location.lat > 90 ||
        location.lng < -180 ||
        location.lng > 180
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Invalid location coordinates',
          { location: ['Location must have valid lat (-90 to 90) and lng (-180 to 180)'] }
        );
      }
    }

    // Check if user has permission to update job status
    try {
      assertPermission(session.role, 'job:write');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch current job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return errorResponse(
          'NOT_FOUND',
          'Job not found',
          undefined,
          404
        );
      }
      console.error('Error fetching job:', jobError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch job',
        undefined,
        500
      );
    }

    // Verify user has access to this job
    if (session.role === 'admin' || session.role === 'manager' || session.role === 'viewer') {
      if (job.assigned_agency_id !== session.agency_id) {
        return errorResponse(
          'FORBIDDEN',
          'You do not have access to this job',
          undefined,
          403
        );
      }
    } else if (session.role === 'engineer') {
      if (job.assigned_engineer_id !== session.user_id) {
        return errorResponse(
          'FORBIDDEN',
          'You do not have access to this job',
          undefined,
          403
        );
      }
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(job.status, newStatus);
    
    if (!transitionValidation.valid) {
      return errorResponse(
        'INVALID_TRANSITION',
        transitionValidation.error!,
        undefined,
        400
      );
    }

    // Prepare job update
    const now = new Date().toISOString();
    const jobUpdate: any = {
      status: newStatus,
      updated_at: now,
    };

    // Set timestamp field for specific statuses (Requirement 6.3)
    const timestampField = getTimestampFieldForStatus(newStatus);
    if (timestampField) {
      jobUpdate[timestampField] = now;
    }

    // Update job status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(jobUpdate)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating job status:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update job status',
        undefined,
        500
      );
    }

    // Record status history with location (Requirement 6.1)
    const statusHistoryEntry: any = {
      job_id: jobId,
      status: newStatus,
      changed_by: session.user_id,
      notes: notes || null,
    };

    // Add location if provided
    if (location) {
      statusHistoryEntry.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      };
    }

    const { error: historyError } = await supabase
      .from('job_status_history')
      .insert(statusHistoryEntry);

    if (historyError) {
      console.error('Error recording status history:', historyError);
      // Don't fail the request if history recording fails
      // Log the error but continue
    }

    // Broadcast status change via Supabase Realtime (Requirement 6.4)
    // The broadcast happens automatically through database triggers and Realtime subscriptions
    // We can also explicitly send a broadcast to the job channel
    const channel = supabase.channel(`job:${jobId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'status_update',
      payload: {
        job_id: jobId,
        status: newStatus,
        timestamp: now,
        location: location || null,
        changed_by: session.user_id,
      },
    });

    // Requirement 6.2: Activate location tracking when status changes to 'travelling'
    // Note: Location tracking activation is handled client-side (mobile app)
    // The mobile app should start tracking when it receives this status update
    // and the status is 'travelling'
    if (newStatus === 'travelling' && job.assigned_engineer_id) {
      // Broadcast location tracking activation to engineer
      const engineerChannel = supabase.channel(`engineer:${job.assigned_engineer_id}`);
      
      await engineerChannel.send({
        type: 'broadcast',
        event: 'start_location_tracking',
        payload: {
          job_id: jobId,
          job_number: job.job_number,
          timestamp: now,
        },
      });
    }

    // Stop location tracking when job is completed or cancelled
    if ((newStatus === 'completed' || newStatus === 'cancelled') && job.assigned_engineer_id) {
      const engineerChannel = supabase.channel(`engineer:${job.assigned_engineer_id}`);
      
      await engineerChannel.send({
        type: 'broadcast',
        event: 'stop_location_tracking',
        payload: {
          job_id: jobId,
          timestamp: now,
        },
      });
    }

    // Fetch status history for response
    const { data: statusHistory } = await supabase
      .from('job_status_history')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build response
    const response = {
      job: updatedJob,
      status_history: statusHistory || [],
      metadata: {
        previous_status: job.status,
        new_status: newStatus,
        transition_valid: true,
        timestamp_recorded: timestampField ? jobUpdate[timestampField] : null,
        location_recorded: !!location,
        realtime_broadcast_sent: true,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/jobs/[id]/status:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
