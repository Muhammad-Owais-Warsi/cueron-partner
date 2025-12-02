/**
 * Job Creation API Route
 * POST /api/jobs - Create a new job
 * 
 * Creates a new job in the system with all required fields and validations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils/src/authorization';
import { preventDemoUserWrites } from '@/lib/demo-data/middleware';
import { z } from 'zod';
import type { CreateJobInput } from '@cueron/types/src/job';

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
function successResponse(data: any, status: number = 201) {
  return NextResponse.json(data, { status });
}

/**
 * Request body schema for job creation
 */
const CreateJobSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  job_type: z.enum(['AMC', 'Repair', 'Installation', 'Emergency']),
  equipment_type: z.string().min(1, 'Equipment type is required'),
  equipment_details: z.object({
    brand: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
    capacity: z.string().optional(),
  }).optional(),
  issue_description: z.string().optional(),
  site_location: z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  required_skill_level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  scheduled_time: z.string().datetime().optional(),
  urgency: z.enum(['emergency', 'urgent', 'normal', 'scheduled']),
  service_fee: z.number().optional(),
});

/**
 * Generate a unique job number
 */
function generateJobNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JOB-${year}-${month}${day}-${random}`;
}

/**
 * POST /api/jobs
 * Create a new job
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have job:create permission (admin or manager)
 * - All required fields must be provided
 * - Data must pass validation
 */
export async function POST(request: NextRequest) {
  try {
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

    // Prevent demo users from performing write operations
    const demoError = preventDemoUserWrites(session);
    if (demoError) return demoError;

    // Check if user has permission to create jobs
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

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateJobSchema.safeParse(body);

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

    const jobData = validation.data as CreateJobInput;

    // Create Supabase client
    const supabase = await createClient();

    // Prepare job data for insertion
    const now = new Date().toISOString();
    const jobToInsert = {
      job_number: generateJobNumber(),
      client_name: jobData.client_name,
      client_phone: jobData.client_phone,
      job_type: jobData.job_type,
      equipment_type: jobData.equipment_type,
      equipment_details: jobData.equipment_details,
      issue_description: jobData.issue_description,
      site_location: jobData.site_location,
      required_skill_level: jobData.required_skill_level,
      scheduled_time: jobData.scheduled_time,
      urgency: jobData.urgency,
      service_fee: jobData.service_fee,
      assigned_agency_id: session.agency_id,
      status: 'pending',
      payment_status: 'pending',
      created_at: now,
      updated_at: now,
    };

    // Insert job into database
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert(jobToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating job:', insertError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to create job',
        undefined,
        500
      );
    }

    // Return created job
    return successResponse({
      job,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/jobs:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * GET /api/jobs
 * Not implemented - use /api/agencies/{id}/jobs for listing
 */
export async function GET() {
  return errorResponse(
    'METHOD_NOT_ALLOWED',
    'Use /api/agencies/{id}/jobs for listing jobs',
    undefined,
    405
  );
}