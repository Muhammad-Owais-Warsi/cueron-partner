/**
 * Tests for Razorpay Webhook Handler
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST } from './route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/razorpay/client');

describe('POST /api/payments/webhook', () => {
  const webhookSecret = 'test_webhook_secret';
  
  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    jest.clearAllMocks();
  });

  const createWebhookRequest = (body: any, signature?: string) => {
    const bodyString = JSON.stringify(body);
    
    const validSignature = signature || crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    return new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': validSignature,
      },
      body: bodyString,
    });
  };

  describe('Signature Verification', () => {
    it('should reject request without signature header', async () => {
      const body = { event: 'payment.captured', payload: {} };
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_SIGNATURE');
      expect(data.error.message).toBe('Missing webhook signature');
    });

    it('should reject request with invalid signature', async () => {
      const body = { event: 'payment.captured', payload: {} };
      const request = createWebhookRequest(body, 'invalid_signature');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_SIGNATURE');
    });

    it('should accept request with valid signature', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        update: jest.fn().mockReturnThis(),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const body = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000,
              method: 'card',
            },
          },
          order: {
            id: 'order_123',
          },
        },
      };
      const request = createWebhookRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return error when webhook secret is not configured', async () => {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      const body = { event: 'payment.captured', payload: {} };
      const request = createWebhookRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('Payload Validation', () => {
    it('should reject invalid JSON payload', async () => {
      const invalidBody = 'not valid json';
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(invalidBody)
        .digest('hex');

      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': signature,
        },
        body: invalidBody,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_PAYLOAD');
    });
  });

  describe('Event Handling', () => {
    it('should handle payment.captured event', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'payment_uuid', status: 'processing' },
          error: null,
        }),
        update: mockUpdate.mockResolvedValue({ error: null }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const body = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000,
              method: 'card',
            },
          },
          order: {
            id: 'order_123',
          },
        },
      };
      const request = createWebhookRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    it('should handle payment.failed event', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'payment_uuid', status: 'processing' },
          error: null,
        }),
        update: mockUpdate.mockResolvedValue({ error: null }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const body = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment failed',
            },
          },
          order: {
            id: 'order_123',
          },
        },
      };
      const request = createWebhookRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        })
      );
    });

    it('should handle unrecognized events gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const body = {
        event: 'unknown.event',
        payload: {},
      };
      const request = createWebhookRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
