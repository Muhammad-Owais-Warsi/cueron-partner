/**
 * Razorpay Webhook Handler
 * POST /api/payments/webhook - Handle Razorpay payment webhooks
 * 
 * Processes webhook events from Razorpay for payment status updates.
 * Validates webhook signatures and updates payment records accordingly.
 * 
 * Requirements: 11.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/razorpay/client';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(message: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook events
 * 
 * Webhook Events Handled:
 * - payment.authorized: Payment authorized by customer
 * - payment.captured: Payment captured successfully
 * - payment.failed: Payment failed
 * - order.paid: Order fully paid
 * 
 * Requirements: 11.3
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return errorResponse(
        'CONFIGURATION_ERROR',
        'Webhook secret not configured',
        500
      );
    }

    // Get webhook signature from headers
    const webhookSignature = request.headers.get('x-razorpay-signature');

    if (!webhookSignature) {
      return errorResponse(
        'INVALID_SIGNATURE',
        'Missing webhook signature',
        400
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      rawBody,
      webhookSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return errorResponse(
        'INVALID_SIGNATURE',
        'Webhook signature verification failed',
        401
      );
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return errorResponse(
        'INVALID_PAYLOAD',
        'Invalid JSON payload',
        400
      );
    }

    const { event, payload: eventPayload } = payload;

    // Log webhook event
    console.log(`Received Razorpay webhook: ${event}`);

    // Create Supabase client (admin client for webhook processing)
    const supabase = await createClient();

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        await handlePaymentSuccess(supabase, eventPayload);
        break;

      case 'payment.failed':
        await handlePaymentFailure(supabase, eventPayload);
        break;

      case 'order.paid':
        await handleOrderPaid(supabase, eventPayload);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return successResponse('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to process webhook',
      500
    );
  }
}

/**
 * Handle successful payment events
 */
async function handlePaymentSuccess(supabase: any, payload: any) {
  const { payment, order } = payload;

  if (!payment || !order) {
    console.error('Missing payment or order data in webhook payload');
    return;
  }

  const orderId = order.id;
  const paymentId = payment.entity.id;

  console.log(`Processing successful payment: ${paymentId} for order: ${orderId}`);

  // Find payment record by gateway order ID
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_gateway_id', orderId)
    .single();

  if (fetchError || !existingPayment) {
    console.error(`Payment record not found for order: ${orderId}`);
    return;
  }

  // Update payment status to completed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      payment_method: payment.entity.method || 'razorpay',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingPayment.id);

  if (updateError) {
    console.error('Error updating payment status:', updateError);
    throw updateError;
  }

  console.log(`Payment ${existingPayment.id} marked as completed`);
}

/**
 * Handle failed payment events
 */
async function handlePaymentFailure(supabase: any, payload: any) {
  const { payment, order } = payload;

  if (!payment || !order) {
    console.error('Missing payment or order data in webhook payload');
    return;
  }

  const orderId = order.id;
  const paymentId = payment.entity.id;
  const errorCode = payment.entity.error_code;
  const errorDescription = payment.entity.error_description;

  console.log(`Processing failed payment: ${paymentId} for order: ${orderId}`);
  console.log(`Error: ${errorCode} - ${errorDescription}`);

  // Find payment record by gateway order ID
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_gateway_id', orderId)
    .single();

  if (fetchError || !existingPayment) {
    console.error(`Payment record not found for order: ${orderId}`);
    return;
  }

  // Update payment status to failed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingPayment.id);

  if (updateError) {
    console.error('Error updating payment status:', updateError);
    throw updateError;
  }

  console.log(`Payment ${existingPayment.id} marked as failed`);

  // TODO: Send notification to agency about payment failure
  // This could integrate with the notification system
}

/**
 * Handle order paid events
 */
async function handleOrderPaid(supabase: any, payload: any) {
  const { order } = payload;

  if (!order) {
    console.error('Missing order data in webhook payload');
    return;
  }

  const orderId = order.entity.id;
  const amountPaid = order.entity.amount_paid / 100; // Convert from paise to INR

  console.log(`Processing order paid: ${orderId}, amount: ₹${amountPaid}`);

  // Find payment record by gateway order ID
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_gateway_id', orderId)
    .single();

  if (fetchError || !existingPayment) {
    console.error(`Payment record not found for order: ${orderId}`);
    return;
  }

  // Update payment status to completed if not already
  if (existingPayment.status !== 'completed') {
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      throw updateError;
    }

    console.log(`Payment ${existingPayment.id} marked as completed via order.paid event`);
  }
}
