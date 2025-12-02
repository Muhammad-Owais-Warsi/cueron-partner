import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { preventDemoUserWrites } from '@/lib/demo-data/middleware';
import { z } from 'zod';

// Validation schema for photo upload
const photoUploadSchema = z.object({
  photo_type: z.enum(['before', 'after']),
  file_name: z.string().min(1),
  file_type: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  file_size: z.number().max(10485760), // 10MB max
});

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * POST /api/jobs/[id]/photos
 * Upload before or after photos for a job
 * 
 * Requirements: 7.3, 7.4, 17.4, 20.4
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const jobId = params.id;

    // Check authentication
    const session = await getUserSession();
    
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Prevent demo users from performing write operations
    const demoError = preventDemoUserWrites(session);
    if (demoError) return demoError;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoType = formData.get('photo_type') as string;

    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file provided',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        },
        { status: 400 }
      );
    }

    // Validate photo type
    const validation = photoUploadSchema.safeParse({
      photo_type: photoType,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid upload parameters',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, assigned_engineer_id, assigned_agency_id, status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if user is the assigned engineer or from the assigned agency
    const { data: engineer } = await supabase
      .from('engineers')
      .select('id, agency_id')
      .eq('user_id', session.user_id)
      .single();

    const { data: agencyUser } = await supabase
      .from('agency_users')
      .select('agency_id')
      .eq('user_id', session.user_id)
      .single();

    const hasAccess =
      (engineer && engineer.id === job.assigned_engineer_id) ||
      (agencyUser && agencyUser.agency_id === job.assigned_agency_id);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to upload photos for this job',
          },
        },
        { status: 403 }
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${jobId}/${photoType}_${timestamp}.${fileExtension}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage with retry logic
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let uploadError: any = null;
    let uploadData: any = null;

    while (uploadAttempts < maxAttempts) {
      const { data, error } = await supabase.storage
        .from('job-photos')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        uploadData = data;
        break;
      }

      uploadError = error;
      uploadAttempts++;

      // Wait before retry (exponential backoff)
      if (uploadAttempts < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, uploadAttempts) * 1000)
        );
      }
    }

    if (uploadError || !uploadData) {
      return NextResponse.json(
        {
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload photo after multiple attempts',
            retry_available: true,
          },
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('job-photos').getPublicUrl(fileName);

    // Update job record with photo URL
    const photoField =
      photoType === 'before' ? 'photos_before' : 'photos_after';

    // Get current photos
    const { data: currentJob } = await supabase
      .from('jobs')
      .select(photoField)
      .eq('id', jobId)
      .single();

    const currentPhotos = ((currentJob?.[photoField as keyof typeof currentJob] as unknown) as string[]) || [];
    const updatedPhotos = [...currentPhotos, publicUrl];

    // Update job with new photo URL
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        [photoField]: updatedPhotos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      // Try to clean up uploaded file
      await supabase.storage.from('job-photos').remove([fileName]);

      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update job record',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        photo_url: publicUrl,
        photo_type: photoType,
        file_name: fileName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/[id]/photos
 * Get all photos for a job
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const jobId = params.id;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get job with photos
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, photos_before, photos_after, assigned_engineer_id, assigned_agency_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job not found',
          },
        },
        { status: 404 }
      );
    }

    // Check access
    const { data: engineer } = await supabase
      .from('engineers')
      .select('id, agency_id')
      .eq('user_id', user.id)
      .single();

    const { data: agencyUser } = await supabase
      .from('agency_users')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    const hasAccess =
      (engineer && engineer.id === job.assigned_engineer_id) ||
      (agencyUser && agencyUser.agency_id === job.assigned_agency_id);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view photos for this job',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      job_id: jobId,
      photos_before: job.photos_before || [],
      photos_after: job.photos_after || [],
    });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
