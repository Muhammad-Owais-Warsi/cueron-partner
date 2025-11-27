/**
 * Job Assignment API Route
 * POST /api/jobs/{id}/assign - Assign an engineer to a job
 * 
 * Validates engineer availability, updates job status to 'assigned',
 * updates engineer status to 'on_job', and sends push notification.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils/src/authorization';
import { z } from 'zod';

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
 * Request body schema for job assignment
 */
const AssignJobSchema = z.object({
  engineer_id: z.string().uuid('Invalid engineer ID format'),
});

/**
 * Send push notification to assigned engineer
 * This is a placeholder implementation - actual FCM integration would be added in Phase 9
 */
async function sendAssignmentNotification(
  engineerId: string,
  _jobId: string,
  jobNumber: string,
  clientName: string
): Promise<boolean> {
  try {
    // TODO: Implement actual FCM push notification in Phase 9
    // For now, we'll log the notification and return success
    console.log(`[NOTIFICATION] Sending job assignment notification to engineer ${engineerId}`);
    console.log(`[NOTIFICATION] Job: ${jobNumber} - Client: ${clientName}`);
    
    // In production, this would call Firebase Cloud Messaging:
    // const fcmToken = await getEngineerFCMToken(engineerId);
    // await sendFCMNotification(fcmToken, {
    //   title: 'New Job Assignment',
    //   body: `You have been assigned to job ${jobNumber} for ${clientName}`,
    //   data: { job_id: jobId, job_number: jobNumber }
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending assignment notification:', error);
    // Don't fail the assignment if notification fails
    return false;
  }
}

/**
 * POST /api/jobs/{id}/assign
 * Assign an engineer to a job
 * 
 * Requirements:
 * - 4.1: Verify engineer availability status is 'available'
 * - 4.2: Update job status to 'assigned' and record assignment timestamp
 * - 4.3: Change engineer availability status to 'on_job'
 * - 4.4: Send push notification to assigned engineer
 * - 4.5: Prevent assignment to engineers already on a job
 */
export async function POST(
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

    // Check if user has permission to assign jobs
    // Only admin and manager roles can assign jobs
    try {
      assertPermission(session.role, 'job:assign');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = AssignJobSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        errors,
        400
      );
    }

    const { engineer_id } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Start a transaction-like operation by fetching all data first
    // then performing updates

    // 1. Fetch job details
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
        'Failed to fetch job details',
        undefined,
        500
      );
    }

    // Verify user has access to this job (data isolation)
    if (job.assigned_agency_id !== session.agency_id) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have access to this job',
        undefined,
        403
      );
    }

    // Check if job is already assigned
    if (job.assigned_engineer_id) {
      return errorResponse(
        'CONFLICT',
        'Job is already assigned to an engineer',
        { job: ['This job has already been assigned'] },
        409
      );
    }

    // 2. Fetch engineer details
    const { data: engineer, error: engineerError } = await supabase
      .from('engineers')
      .select('*')
      .eq('id', engineer_id)
      .single();

    if (engineerError) {
      if (engineerError.code === 'PGRST116') {
        return errorResponse(
          'NOT_FOUND',
          'Engineer not found',
          undefined,
          404
        );
      }
      console.error('Error fetching engineer:', engineerError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch engineer details',
        undefined,
        500
      );
    }

    // Verify engineer belongs to the same agency as the job
    if (engineer.agency_id !== job.assigned_agency_id) {
      return errorResponse(
        'FORBIDDEN',
        'Engineer does not belong to the assigned agency',
        undefined,
        403
      );
    }

    // Requirement 4.1 & 4.5: Verify engineer availability status is 'available'
    // Prevent double assignment of busy engineers
    if (engineer.availability_status !== 'available') {
      return errorResponse(
        'CONFLICT',
        `Engineer is not available for assignment. Current status: ${engineer.availability_status}`,
        { engineer_id: [`Engineer availability status is '${engineer.availability_status}', must be 'available'`] },
        409
      );
    }

    // 3. Update job status to 'assigned' with timestamp (Requirement 4.2)
    const now = new Date().toISOString();
    const { data: updatedJob, error: updateJobError } = await supabase
      .from('jobs')
      .update({
        assigned_engineer_id: engineer_id,
        status: 'assigned',
        assigned_at: now,
        updated_at: now,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateJobError) {
      console.error('Error updating job:', updateJobError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to assign engineer to job',
        undefined,
        500
      );
    }

    // 4. Update engineer availability to 'on_job' (Requirement 4.3)
    const { error: updateEngineerError } = await supabase
      .from('engineers')
      .update({
        availability_status: 'on_job',
        updated_at: now,
      })
      .eq('id', engineer_id);

    if (updateEngineerError) {
      console.error('Error updating engineer status:', updateEngineerError);
      
      // Rollback job assignment if engineer update fails
      await supabase
        .from('jobs')
        .update({
          assigned_engineer_id: null,
          status: job.status, // Restore original status
          assigned_at: null,
          updated_at: now,
        })
        .eq('id', jobId);

      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update engineer availability',
        undefined,
        500
      );
    }

    // 5. Send push notification to assigned engineer (Requirement 4.4)
    const notificationSent = await sendAssignmentNotification(
      engineer_id,
      jobId,
      job.job_number,
      job.client_name
    );

    // Build response
    const response = {
      job: updatedJob,
      engineer: {
        id: engineer.id,
        name: engineer.name,
        phone: engineer.phone,
        availability_status: 'on_job',
      },
      assignment: {
        assigned_at: now,
        assigned_by: session.user_id,
      },
      notification_sent: notificationSent,
    };

    return successResponse(response, 200);
  } catch (error) {
    console.error('Unexpected error in POST /api/jobs/[id]/assign:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
