/**
 * Service Checklist Management API Route
 * PATCH /api/jobs/{id}/checklist - Update service checklist for a job
 * GET /api/jobs/{id}/checklist - Get service checklist with completion status
 * 
 * Provides checklist display logic, completion tracking, persistence,
 * and validation for service delivery workflow.
 * 
 * Requirements: 7.1, 7.2, 7.5, 8.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils/src/authorization';
import type { ChecklistItem } from '@cueron/types/src/job';

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
 * Validate checklist items structure
 */
function validateChecklistItems(items: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(items)) {
    errors.push('Checklist must be an array');
    return { isValid: false, errors };
  }

  items.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} must be an object`);
      return;
    }

    if (typeof item.item !== 'string' || item.item.trim() === '') {
      errors.push(`Item at index ${index} must have a non-empty 'item' string`);
    }

    if (typeof item.completed !== 'boolean') {
      errors.push(`Item at index ${index} must have a 'completed' boolean`);
    }

    if (item.notes !== undefined && typeof item.notes !== 'string') {
      errors.push(`Item at index ${index} 'notes' must be a string if provided`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if all mandatory checklist items are completed
 * Requirements 7.5, 8.1: Completion enablement and validation
 */
function areAllMandatoryItemsCompleted(checklist: ChecklistItem[]): boolean {
  if (!checklist || checklist.length === 0) {
    return false;
  }

  // All items are considered mandatory unless explicitly marked otherwise
  // For now, we treat all items as mandatory
  return checklist.every(item => item.completed === true);
}

/**
 * Calculate checklist completion statistics
 */
function calculateChecklistStats(checklist: ChecklistItem[]) {
  const total = checklist.length;
  const completed = checklist.filter(item => item.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total_items: total,
    completed_items: completed,
    pending_items: total - completed,
    completion_percentage: percentage,
    all_completed: completed === total,
  };
}

/**
 * GET /api/jobs/{id}/checklist
 * Get service checklist with completion status
 * 
 * Requirements:
 * - 7.1: Display all required verification items
 */
export async function GET(
  _request: NextRequest,
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

    // Engineers can read their assigned jobs' checklists
    // Agency users can read checklists for jobs assigned to their agency
    try {
      assertPermission(session.role, 'job:read');
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

    // Fetch job with checklist
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, service_checklist, assigned_engineer_id, assigned_agency_id')
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
        'Failed to fetch job checklist',
        undefined,
        500
      );
    }

    // Verify access permissions
    if (session.role === 'engineer') {
      if (job.assigned_engineer_id !== session.user_id) {
        return errorResponse(
          'FORBIDDEN',
          'You can only view checklists for jobs assigned to you',
          undefined,
          403
        );
      }
    } else if (session.role === 'admin' || session.role === 'manager' || session.role === 'viewer') {
      if (job.assigned_agency_id !== session.agency_id) {
        return errorResponse(
          'FORBIDDEN',
          'You can only view checklists for jobs assigned to your agency',
          undefined,
          403
        );
      }
    }

    // Get checklist or return empty array if not set
    const checklist: ChecklistItem[] = job.service_checklist || [];

    // Calculate statistics
    const stats = calculateChecklistStats(checklist);

    // Determine if completion is enabled (Requirements 7.5)
    const completionEnabled = job.status === 'onsite' && stats.all_completed;

    return successResponse({
      job_id: job.id,
      status: job.status,
      checklist,
      stats,
      completion_enabled: completionEnabled,
      can_complete_job: completionEnabled,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/jobs/[id]/checklist:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * PATCH /api/jobs/{id}/checklist
 * Update service checklist items
 * 
 * Requirements:
 * - 7.2: Store completion status in job record
 * - 7.5: Enable job completion when all items complete
 * - 8.1: Validate all mandatory items completed before allowing job completion
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

    // Only engineers can update checklists
    if (session.role !== 'engineer') {
      return errorResponse(
        'FORBIDDEN',
        'Only engineers can update service checklists',
        undefined,
        403
      );
    }

    // Parse request body
    const body = await request.json();
    const { checklist } = body;

    if (!checklist) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Checklist is required',
        { checklist: ['Checklist array is required'] },
        400
      );
    }

    // Validate checklist structure
    const validation = validateChecklistItems(checklist);
    if (!validation.isValid) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid checklist format',
        { checklist: validation.errors },
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch job to verify access and status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, assigned_engineer_id, service_checklist')
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

    // Verify engineer is assigned to this job
    if (job.assigned_engineer_id !== session.user_id) {
      return errorResponse(
        'FORBIDDEN',
        'You can only update checklists for jobs assigned to you',
        undefined,
        403
      );
    }

    // Verify job is in correct status (onsite)
    if (job.status !== 'onsite') {
      return errorResponse(
        'INVALID_STATUS',
        'Checklist can only be updated when job status is "onsite"',
        { status: [`Current status is "${job.status}", must be "onsite"`] },
        400
      );
    }

    // Update checklist in database (Requirement 7.2: Persistence)
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        service_checklist: checklist,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select('id, status, service_checklist')
      .single();

    if (updateError) {
      console.error('Error updating checklist:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update checklist',
        undefined,
        500
      );
    }

    // Calculate statistics
    const stats = calculateChecklistStats(checklist);

    // Determine if completion is enabled (Requirements 7.5, 8.1)
    const allMandatoryCompleted = areAllMandatoryItemsCompleted(checklist);
    const completionEnabled = allMandatoryCompleted;

    return successResponse({
      job_id: updatedJob.id,
      status: updatedJob.status,
      checklist: updatedJob.service_checklist,
      stats,
      completion_enabled: completionEnabled,
      can_complete_job: completionEnabled,
      message: completionEnabled 
        ? 'All checklist items completed. Job completion is now enabled.'
        : 'Checklist updated successfully. Complete all items to enable job completion.',
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/jobs/[id]/checklist:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
