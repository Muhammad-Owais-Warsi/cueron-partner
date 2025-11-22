/**
 * Agency Profile Management API Routes
 * GET /api/agencies/{id} - Get agency details
 * PATCH /api/agencies/{id} - Update agency profile
 * 
 * Handles agency profile retrieval and updates with validation,
 * authorization checks, and bank detail encryption.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { UpdateAgencyInputSchema } from '@cueron/utils/src/schemas';
import { encrypt, decrypt } from '@cueron/utils/src/encryption';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import type { UpdateAgencyInput } from '@cueron/types/src/agency';

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
 * GET /api/agencies/{id}
 * Retrieve agency details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agencyId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agencyId)) {
      return errorResponse(
        'INVALID_ID',
        'Invalid agency ID format',
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

    // Check if user has permission to read agency data
    try {
      assertPermission(session.role, 'agency:read');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check data isolation - user can only access their own agency
    try {
      assertAgencyAccess(session.agency_id, agencyId);
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

    // Fetch agency details
    const { data: agency, error: fetchError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .single();

    if (fetchError) {
      console.error('Error fetching agency:', fetchError);
      
      if (fetchError.code === 'PGRST116') {
        return errorResponse(
          'NOT_FOUND',
          'Agency not found',
          undefined,
          404
        );
      }
      
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch agency details',
        undefined,
        500
      );
    }

    // Decrypt sensitive bank details if present
    if (agency.bank_account_number) {
      try {
        agency.bank_account_number = decrypt(agency.bank_account_number);
      } catch (decryptError) {
        console.error('Decryption error for bank account:', decryptError);
        // Don't expose decryption errors to client
        agency.bank_account_number = undefined;
      }
    }

    if (agency.pan_number) {
      try {
        agency.pan_number = decrypt(agency.pan_number);
      } catch (decryptError) {
        console.error('Decryption error for PAN:', decryptError);
        agency.pan_number = undefined;
      }
    }

    return successResponse(agency);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * PATCH /api/agencies/{id}
 * Update agency profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agencyId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agencyId)) {
      return errorResponse(
        'INVALID_ID',
        'Invalid agency ID format',
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

    // Check if user has permission to write agency data
    try {
      assertPermission(session.role, 'agency:write');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check data isolation - user can only update their own agency
    try {
      assertAgencyAccess(session.agency_id, agencyId);
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input data with Zod
    const validation = UpdateAgencyInputSchema.safeParse(body);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.errors.forEach((err: any) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        fieldErrors,
        400
      );
    }

    const updateData: UpdateAgencyInput = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Encrypt sensitive bank details if provided
    const updatePayload: any = { ...updateData };

    try {
      if (updateData.bank_account_number) {
        updatePayload.bank_account_number = encrypt(updateData.bank_account_number);
      }
      if (updateData.pan_number) {
        updatePayload.pan_number = encrypt(updateData.pan_number);
      }
    } catch (encryptError) {
      console.error('Encryption error:', encryptError);
      return errorResponse(
        'ENCRYPTION_ERROR',
        'Failed to encrypt sensitive data',
        undefined,
        500
      );
    }

    // Add updated_at timestamp
    updatePayload.updated_at = new Date().toISOString();

    // Update agency record
    const { data: updatedAgency, error: updateError } = await supabase
      .from('agencies')
      .update(updatePayload)
      .eq('id', agencyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agency:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return errorResponse(
          'NOT_FOUND',
          'Agency not found',
          undefined,
          404
        );
      }
      
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update agency',
        undefined,
        500
      );
    }

    // Decrypt sensitive data for response
    if (updatedAgency.bank_account_number) {
      try {
        updatedAgency.bank_account_number = decrypt(updatedAgency.bank_account_number);
      } catch (decryptError) {
        console.error('Decryption error for bank account:', decryptError);
        updatedAgency.bank_account_number = undefined;
      }
    }

    if (updatedAgency.pan_number) {
      try {
        updatedAgency.pan_number = decrypt(updatedAgency.pan_number);
      } catch (decryptError) {
        console.error('Decryption error for PAN:', decryptError);
        updatedAgency.pan_number = undefined;
      }
    }

    return successResponse({
      agency: updatedAgency,
      message: 'Agency profile updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/agencies/[id]:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
