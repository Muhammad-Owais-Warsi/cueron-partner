/**
 * Agency Payments API Route
 * GET /api/agencies/{id}/payments - List payments for an agency
 * 
 * Provides payment listing with agency data isolation.
 * Supports filtering by status and date range.
 * 
 * Requirements: 11.1, 11.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import type { PaymentStatus } from '@cueron/types/src/payment';

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
 * GET /api/agencies/{id}/payments
 * List payments for an agency with filtering
 * 
 * Query Parameters:
 * - status: Comma-separated payment statuses (e.g., "pending,processing")
 * - date_from: ISO date string for start of date range
 * - date_to: ISO date string for end of date range
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * 
 * Property 48: Payment list isolation
 * Validates: Requirements 11.1
 */
export async function GET(
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
    // Property 48: Payment list isolation
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Status filter
    const statusParam = searchParams.get('status');
    const statusFilter: PaymentStatus[] | null = statusParam
      ? statusParam.split(',').map(s => s.trim() as PaymentStatus)
      : null;

    // Date range filter
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Validate status filter
    const validStatuses: PaymentStatus[] = [
      'pending', 'processing', 'completed', 'failed', 'refunded'
    ];

    if (statusFilter) {
      const invalidStatuses = statusFilter.filter(s => !validStatuses.includes(s));
      if (invalidStatuses.length > 0) {
        return errorResponse(
          'INVALID_FILTER',
          `Invalid status values: ${invalidStatuses.join(', ')}`,
          { status: [`Valid values are: ${validStatuses.join(', ')}`] },
          400
        );
      }
    }

    // Validate date range
    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return errorResponse(
        'INVALID_FILTER',
        'Invalid date_from format. Use ISO 8601 format',
        { date_from: ['Must be a valid ISO 8601 date string'] },
        400
      );
    }

    if (dateTo && isNaN(Date.parse(dateTo))) {
      return errorResponse(
        'INVALID_FILTER',
        'Invalid date_to format. Use ISO 8601 format',
        { date_to: ['Must be a valid ISO 8601 date string'] },
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Build query with filters
    // Property 48: Payment list isolation - only return payments for this agency
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('agency_id', agencyId);

    // Apply status filter
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    // Apply date range filter on created_at
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply sorting (most recent first)
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: payments, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching payments:', fetchError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch payments',
        undefined,
        500
      );
    }

    // Build response
    const response = {
      payments: payments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: page < Math.ceil((count || 0) / limit),
        has_prev: page > 1,
      },
      filters_applied: {
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      },
    };

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/payments:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * PATCH /api/agencies/{id}/payments
 * Update payment status and record timestamps
 * 
 * Request Body:
 * - payment_id: UUID of the payment to update
 * - status: New payment status
 * - payment_gateway_id: Optional gateway transaction ID
 * - invoice_number: Optional invoice number
 * - invoice_url: Optional invoice URL
 * 
 * Property 50: Payment processing update
 * Validates: Requirements 11.3
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

    // Check if user has permission to update payments
    try {
      assertPermission(session.role, 'payment:write');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check data isolation
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse(
        'INVALID_REQUEST',
        'Invalid JSON in request body',
        undefined,
        400
      );
    }
    
    const { payment_id, status, payment_gateway_id, invoice_number, invoice_url } = body;

    // Validate required fields
    if (!payment_id) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required field: payment_id',
        { payment_id: ['Payment ID is required'] },
        400
      );
    }

    if (!uuidRegex.test(payment_id)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid payment ID format',
        { payment_id: ['Must be a valid UUID'] },
        400
      );
    }

    // Validate status if provided
    const validStatuses: PaymentStatus[] = [
      'pending', 'processing', 'completed', 'failed', 'refunded'
    ];

    if (status && !validStatuses.includes(status)) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Invalid status value: ${status}`,
        { status: [`Valid values are: ${validStatuses.join(', ')}`] },
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // First, verify the payment belongs to this agency
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('agency_id', agencyId)
      .single();

    if (fetchError || !existingPayment) {
      return errorResponse(
        'NOT_FOUND',
        'Payment not found or does not belong to this agency',
        undefined,
        404
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Property 50: Payment processing update
    // When status changes to 'completed', record paid_at timestamp
    if (status) {
      updateData.status = status;
      
      if (status === 'completed' && !existingPayment.paid_at) {
        updateData.paid_at = new Date().toISOString();
      }
    }

    if (payment_gateway_id !== undefined) {
      updateData.payment_gateway_id = payment_gateway_id;
    }

    if (invoice_number !== undefined) {
      updateData.invoice_number = invoice_number;
    }

    if (invoice_url !== undefined) {
      updateData.invoice_url = invoice_url;
    }

    // Update payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment_id)
      .eq('agency_id', agencyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update payment',
        undefined,
        500
      );
    }

    return successResponse({
      payment: updatedPayment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/agencies/[id]/payments:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}


/**
 * POST /api/agencies/{id}/payments
 * Create a Razorpay payment order
 * 
 * Request Body:
 * - payment_id: UUID of the payment record
 * - amount: Payment amount in INR (optional, will use payment record amount if not provided)
 * 
 * This endpoint integrates with Razorpay to create a payment order
 * and returns the order details for client-side checkout.
 * 
 * Requirements: 11.3
 */
export async function POST(
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

    // Check if user has permission to create payments
    try {
      assertPermission(session.role, 'payment:write');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check data isolation
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse(
        'INVALID_REQUEST',
        'Invalid JSON in request body',
        undefined,
        400
      );
    }
    
    const { payment_id, amount: requestAmount } = body;

    // Validate required fields
    if (!payment_id) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required field: payment_id',
        { payment_id: ['Payment ID is required'] },
        400
      );
    }

    if (!uuidRegex.test(payment_id)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid payment ID format',
        { payment_id: ['Must be a valid UUID'] },
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Verify the payment belongs to this agency
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('agency_id', agencyId)
      .single();

    if (fetchError || !existingPayment) {
      return errorResponse(
        'NOT_FOUND',
        'Payment not found or does not belong to this agency',
        undefined,
        404
      );
    }

    // Check if payment is already processed
    if (existingPayment.status === 'completed') {
      return errorResponse(
        'INVALID_STATE',
        'Payment is already completed',
        undefined,
        400
      );
    }

    // Use amount from request or payment record
    const amount = requestAmount || existingPayment.amount;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid amount',
        { amount: ['Amount must be a positive number'] },
        400
      );
    }

    // Import Razorpay client utilities
    const { getRazorpayConfig, createRazorpayOrder } = await import('@/lib/razorpay/client');

    // Get Razorpay configuration
    let razorpayConfig;
    try {
      razorpayConfig = getRazorpayConfig();
    } catch (error: any) {
      console.error('Razorpay configuration error:', error);
      return errorResponse(
        'CONFIGURATION_ERROR',
        'Payment gateway not configured',
        undefined,
        500
      );
    }

    // Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder(
        {
          amount,
          currency: 'INR',
          receipt: payment_id,
          notes: {
            agency_id: agencyId,
            payment_id: payment_id,
            payment_type: existingPayment.payment_type,
          },
        },
        razorpayConfig
      );
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      return errorResponse(
        'GATEWAY_ERROR',
        'Failed to create payment order',
        undefined,
        500
      );
    }

    // Update payment with gateway order ID and set status to processing
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        payment_gateway_id: razorpayOrder.id,
        status: 'processing',
        payment_method: 'razorpay',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id)
      .eq('agency_id', agencyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update payment',
        undefined,
        500
      );
    }

    // Return order details for client-side Razorpay checkout
    return successResponse({
      order_id: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      key_id: razorpayConfig.keyId,
      payment: updatedPayment,
      message: 'Payment order created successfully',
    }, 201);
  } catch (error) {
    console.error('Unexpected error in POST /api/agencies/[id]/payments:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
