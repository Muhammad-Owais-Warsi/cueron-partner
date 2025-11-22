/**
 * Razorpay Client Integration
 * 
 * Provides utilities for integrating with Razorpay payment gateway.
 * Handles order creation, payment verification, and webhook signature validation.
 * 
 * Requirements: 11.3
 */

import crypto from 'crypto';

/**
 * Razorpay configuration
 */
export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/**
 * Razorpay order creation options
 */
export interface CreateOrderOptions {
  amount: number; // Amount in INR (will be converted to paise)
  currency?: string;
  receipt: string; // Unique receipt ID (payment_id)
  notes?: Record<string, string>;
}

/**
 * Razorpay order response
 */
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * Razorpay payment verification data
 */
export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Get Razorpay configuration from environment
 */
export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return { keyId, keySecret };
}

/**
 * Create a Razorpay order
 * 
 * Makes an API call to Razorpay to create a payment order.
 * The order ID is used for client-side checkout.
 */
export async function createRazorpayOrder(
  options: CreateOrderOptions,
  config: RazorpayConfig
): Promise<RazorpayOrder> {
  const { amount, currency = 'INR', receipt, notes = {} } = options;

  // Convert amount to paise (Razorpay expects amount in smallest currency unit)
  const amountInPaise = Math.round(amount * 100);

  // Prepare request body
  const requestBody = {
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  };

  // Create Basic Auth header
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');

  // Make API request to Razorpay
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay order creation failed: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const order: RazorpayOrder = await response.json();
  return order;
}

/**
 * Verify Razorpay payment signature
 * 
 * Validates the webhook signature to ensure the payment callback
 * is authentic and from Razorpay.
 * 
 * @param data Payment verification data from Razorpay
 * @param config Razorpay configuration
 * @returns true if signature is valid, false otherwise
 */
export function verifyPaymentSignature(
  data: PaymentVerificationData,
  config: RazorpayConfig
): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  // Create the expected signature
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(text)
    .digest('hex');

  // Check if signatures have the same length before comparison
  if (expectedSignature.length !== razorpay_signature.length) {
    return false;
  }

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );
  } catch (error) {
    // If comparison fails for any reason, signature is invalid
    return false;
  }
}

/**
 * Verify Razorpay webhook signature
 * 
 * Validates webhook signatures to ensure webhook events
 * are authentic and from Razorpay.
 * 
 * @param webhookBody Raw webhook body as string
 * @param webhookSignature Signature from X-Razorpay-Signature header
 * @param webhookSecret Webhook secret from Razorpay dashboard
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookBody)
    .digest('hex');

  // Check if signatures have the same length before comparison
  if (expectedSignature.length !== webhookSignature.length) {
    return false;
  }

  // Compare signatures using timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(webhookSignature)
    );
  } catch (error) {
    // If comparison fails for any reason, signature is invalid
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * 
 * Retrieves payment information from Razorpay API for verification.
 */
export async function fetchPaymentDetails(
  paymentId: string,
  config: RazorpayConfig
): Promise<any> {
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');

  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch payment details: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return await response.json();
}
