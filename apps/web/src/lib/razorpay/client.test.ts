/**
 * Tests for Razorpay Client Integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import crypto from 'crypto';
import {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  type RazorpayConfig,
  type CreateOrderOptions,
  type PaymentVerificationData,
} from './client';

describe('Razorpay Client', () => {
  const mockConfig: RazorpayConfig = {
    keyId: 'rzp_test_123456',
    keySecret: 'test_secret_key_123',
  };

  beforeEach(() => {
    // Clear environment variables
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  describe('getRazorpayConfig', () => {
    it('should return config when environment variables are set', () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_123';

      const config = getRazorpayConfig();

      expect(config.keyId).toBe('rzp_test_123');
      expect(config.keySecret).toBe('secret_123');
    });

    it('should throw error when key ID is missing', () => {
      process.env.RAZORPAY_KEY_SECRET = 'secret_123';

      expect(() => getRazorpayConfig()).toThrow('Razorpay credentials not configured');
    });

    it('should throw error when key secret is missing', () => {
      process.env.RAZORPAY_KEY_ID = 'rzp_test_123';

      expect(() => getRazorpayConfig()).toThrow('Razorpay credentials not configured');
    });

    it('should throw error when both credentials are missing', () => {
      expect(() => getRazorpayConfig()).toThrow('Razorpay credentials not configured');
    });
  });

  describe('createRazorpayOrder', () => {
    const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
    });

    it('should create order with correct parameters', async () => {
      const mockOrder = {
        id: 'order_abc123',
        entity: 'order',
        amount: 50000,
        amount_paid: 0,
        amount_due: 50000,
        currency: 'INR',
        receipt: 'payment_uuid',
        status: 'created',
        attempts: 0,
        notes: { test: 'note' },
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const options: CreateOrderOptions = {
        amount: 500,
        currency: 'INR',
        receipt: 'payment_uuid',
        notes: { test: 'note' },
      };

      const order = await createRazorpayOrder(options, mockConfig);

      expect(order).toEqual(mockOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.razorpay.com/v1/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Basic'),
          }),
        })
      );

      // Verify amount conversion to paise
      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.amount).toBe(50000); // 500 * 100
    });

    it('should use default currency when not provided', async () => {
      const mockOrder = {
        id: 'order_abc123',
        entity: 'order',
        amount: 100000,
        amount_paid: 0,
        amount_due: 100000,
        currency: 'INR',
        receipt: 'payment_uuid',
        status: 'created',
        attempts: 0,
        notes: {},
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const options: CreateOrderOptions = {
        amount: 1000,
        receipt: 'payment_uuid',
      };

      await createRazorpayOrder(options, mockConfig);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.currency).toBe('INR');
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      } as Response);

      const options: CreateOrderOptions = {
        amount: 500,
        receipt: 'payment_uuid',
      };

      await expect(createRazorpayOrder(options, mockConfig)).rejects.toThrow(
        'Razorpay order creation failed'
      );
    });
  });

  describe('verifyPaymentSignature', () => {
    it('should return true for valid signature', () => {
      const orderId = 'order_abc123';
      const paymentId = 'pay_xyz789';
      const text = `${orderId}|${paymentId}`;
      
      const validSignature = crypto
        .createHmac('sha256', mockConfig.keySecret)
        .update(text)
        .digest('hex');

      const data: PaymentVerificationData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      };

      const result = verifyPaymentSignature(data, mockConfig);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const data: PaymentVerificationData = {
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_xyz789',
        razorpay_signature: 'invalid_signature',
      };

      const result = verifyPaymentSignature(data, mockConfig);

      expect(result).toBe(false);
    });

    it('should return false for tampered order ID', () => {
      const orderId = 'order_abc123';
      const paymentId = 'pay_xyz789';
      const text = `${orderId}|${paymentId}`;
      
      const validSignature = crypto
        .createHmac('sha256', mockConfig.keySecret)
        .update(text)
        .digest('hex');

      const data: PaymentVerificationData = {
        razorpay_order_id: 'order_tampered',
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      };

      const result = verifyPaymentSignature(data, mockConfig);

      expect(result).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    const webhookSecret = 'webhook_secret_123';

    it('should return true for valid webhook signature', () => {
      const webhookBody = JSON.stringify({ event: 'payment.captured', payload: {} });
      
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      const result = verifyWebhookSignature(webhookBody, validSignature, webhookSecret);

      expect(result).toBe(true);
    });

    it('should return false for invalid webhook signature', () => {
      const webhookBody = JSON.stringify({ event: 'payment.captured', payload: {} });
      const invalidSignature = 'invalid_signature';

      const result = verifyWebhookSignature(webhookBody, invalidSignature, webhookSecret);

      expect(result).toBe(false);
    });

    it('should return false for tampered webhook body', () => {
      const webhookBody = JSON.stringify({ event: 'payment.captured', payload: {} });
      
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      const tamperedBody = JSON.stringify({ event: 'payment.failed', payload: {} });

      const result = verifyWebhookSignature(tamperedBody, validSignature, webhookSecret);

      expect(result).toBe(false);
    });
  });

  describe('fetchPaymentDetails', () => {
    const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
    });

    it('should fetch payment details successfully', async () => {
      const mockPayment = {
        id: 'pay_abc123',
        entity: 'payment',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        order_id: 'order_xyz789',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayment,
      } as Response);

      const paymentId = 'pay_abc123';
      const payment = await fetchPaymentDetails(paymentId, mockConfig);

      expect(payment).toEqual(mockPayment);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should throw error when API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Payment not found' }),
      } as Response);

      const paymentId = 'pay_invalid';

      await expect(fetchPaymentDetails(paymentId, mockConfig)).rejects.toThrow(
        'Failed to fetch payment details'
      );
    });
  });
});
