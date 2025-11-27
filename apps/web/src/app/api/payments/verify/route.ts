/**
 * Payment Verification API Route
 * POST /api/payments/verify - Verify Razorpay payment
 * 
 * Verifies payment signature from client-side Razorpay checkout
 * and updates payment status accordingly.
 * 
 * Requirements: 11.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import {
  getRazorpayConfig,
  verifyPaymentSignature,
  fetchPaymentDetails,
  type PaymentVerificationData,
} from '@/lib/razorpay/client';

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
 * POST /api/payments/verify
 * Verify Razorpay payment signature
 * 
 * Request Body:
 * - payment_id: UUID of the payment record in our database
 * - razorpay_order_id: Order ID from Razorpay
 * - razorpay_payment_id: Payment ID from Razorpay
 * - razorpay_signature: Signature from Razorpay checkout
 * 
 * This endpoint is called after successful payment on the client side
 * to verify the payment signature and update our records.
 * 
 * Requirements: 11.3
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

    // Check if user has permission to verify payments
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
    
    const { 
      payment_id, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = body;

    // Validate required fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing Razorpay verification data',
        {
          razorpay_order_id: razorpay_order_id ? [] : ['Order ID is required'],
          razorpay_payment_id: razorpay_payment_id ? [] : ['Payment ID is required'],
          razorpay_signature: razorpay_signature ? [] : ['Signature is required'],
        },
        400
      );
    }

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

    // Create Supabase client
    const supabase = await createClient();

    // Fetch payment record
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (fetchError || !payment) {
      return errorResponse(
        'NOT_FOUND',
        'Payment not found',
        undefined,
        404
      );
    }

    // Check data isolation - user can only verify payments for their agency
    if (payment.agency_id) {
      try {
        assertAgencyAccess(session.agency_id, payment.agency_id);
      } catch (error: any) {
        return errorResponse(
          'FORBIDDEN',
          error.message,
          undefined,
          403
        );
      }
    }

    // Verify that the order ID matches
    if (payment.payment_gateway_id !== razorpay_order_id) {
      return errorResponse(
        'VERIFICATION_FAILED',
        'Order ID mismatch',
        { razorpay_order_id: ['Order ID does not match payment record'] },
        400
      );
    }

    // Verify payment signature
    const verificationData: PaymentVerificationData = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    const isSignatureValid = verifyPaymentSignature(
      verificationData,
      razorpayConfig
    );

    if (!isSignatureValid) {
      console.error('Payment signature verification failed');
      
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment_id);

      return errorResponse(
        'VERIFICATION_FAILED',
        'Payment signature verification failed',
        undefined,
        400
      );
    }

    // Fetch payment details from Razorpay for additional verification
    let razorpayPayment;
    try {
      razorpayPayment = await fetchPaymentDetails(
        razorpay_payment_id,
        razorpayConfig
      );
    } catch (error: any) {
      console.error('Error fetching payment details from Razorpay:', error);
      return errorResponse(
        'GATEWAY_ERROR',
        'Failed to verify payment with gateway',
        undefined,
        500
      );
    }

    // Verify payment status from Razorpay
    if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
      return errorResponse(
        'VERIFICATION_FAILED',
        `Payment status is ${razorpayPayment.status}`,
        undefined,
        400
      );
    }

    // Verify amount matches
    const amountInPaise = Math.round(payment.amount * 100);
    if (razorpayPayment.amount !== amountInPaise) {
      console.error('Payment amount mismatch');
      return errorResponse(
        'VERIFICATION_FAILED',
        'Payment amount mismatch',
        undefined,
        400
      );
    }

    // Update payment status to completed
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        payment_method: razorpayPayment.method || 'razorpay',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update payment status',
        undefined,
        500
      );
    }

    console.log(`Payment ${payment_id} verified and marked as completed`);

    return successResponse({
      payment: updatedPayment,
      razorpay_payment_id,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/payments/verify:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
