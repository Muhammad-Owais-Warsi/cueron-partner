/**
 * Tests for Payment Verification API
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST } from './route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');
jest.mock('@cueron/utils/src/authorization');
jest.mock('@/lib/razorpay/client');

describe('POST /api/payments/verify', () => {
  const mockSession = {
    user_id: 'user_123',
    agency_id: 'agency_123',
    role: 'admin',
  };

  const mockPayment = {
    id: 'payment_123',
    agency_id: 'agency_123',
    amount: 500,
    status: 'processing',
    payment_gateway_id: 'order_abc123',
  };

  const razorpayConfig = {
    keyId: 'rzp_test_123',
    keySecret: 'test_secret',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = razorpayConfig.keyId;
    process.env.RAZORPAY_KEY_SECRET = razorpayConfig.keySecret;
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const { getUserSession } = await import('@/lib/auth');
      (getUserSession as jest.MockedFunction<typeof getUserSession>).mockResolvedValue(null);

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests without payment:write permission', async () => {
      const { getUserSession } = await import('@/lib/auth');
      const { assertPermission } = await import('@cueron/utils/src/authorization');
      
      (getUserSession as jest.MockedFunction<typeof getUserSession>).mockResolvedValue(mockSession);
      (assertPermission as jest.MockedFunction<typeof assertPermission>).mockImplementation(() => {
        throw new Error('Insufficient permissions');
      });

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should reject requests for other agency payments', async () => {
      const { getUserSession } = await import('@/lib/auth');
      const { assertPermission, assertAgencyAccess } = await import('@cueron/utils/src/authorization');
      const { createClient } = await import('@/lib/supabase/server');
      
      (getUserSession as jest.MockedFunction<typeof getUserSession>).mockResolvedValue(mockSession);
      (assertPermission as jest.MockedFunction<typeof assertPermission>).mockImplementation(() => {});
      (assertAgencyAccess as jest.MockedFunction<typeof assertAgencyAccess>).mockImplementation(() => {
        throw new Error('Access denied to this agency\'s data');
      });

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockPayment, agency_id: 'other_agency' },
          error: null,
        }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      const { getUserSession } = await import('@/lib/auth');
      const { assertPermission } = await import('@cueron/utils/src/authorization');
      
      (getUserSession as jest.MockedFunction<typeof getUserSession>).mockResolvedValue(mockSession);
      (assertPermission as jest.MockedFunction<typeof assertPermission>).mockImplementation(() => {});
    });

    it('should reject request without payment_id', async () => {
      const request = createRequest({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details?.payment_id).toBeDefined();
    });

    it('should reject request with invalid payment_id format', async () => {
      const request = createRequest({
        payment_id: 'invalid-uuid',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request without Razorpay verification data', async () => {
      const request = createRequest({
        payment_id: '123e4567-e89b-12d3-a456-426614174000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Razorpay verification data');
    });
  });

  describe('Payment Verification', () => {
    beforeEach(async () => {
      const { getUserSession } = await import('@/lib/auth');
      const { assertPermission, assertAgencyAccess } = await import('@cueron/utils/src/authorization');
      
      (getUserSession as jest.MockedFunction<typeof getUserSession>).mockResolvedValue(mockSession);
      (assertPermission as jest.MockedFunction<typeof assertPermission>).mockImplementation(() => {});
      (assertAgencyAccess as jest.MockedFunction<typeof assertAgencyAccess>).mockImplementation(() => {});
    });

    it('should return 404 when payment not found', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const request = createRequest({
        payment_id: '123e4567-e89b-12d3-a456-426614174000',
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should reject when order ID does not match', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_different',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VERIFICATION_FAILED');
      expect(data.error.message).toContain('Order ID mismatch');
    });

    it('should reject when signature verification fails', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { verifyPaymentSignature } = await import('@/lib/razorpay/client');
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);
      (verifyPaymentSignature as jest.MockedFunction<typeof verifyPaymentSignature>).mockReturnValue(false);

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'invalid_sig',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VERIFICATION_FAILED');
    });

    it('should successfully verify and update payment', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { verifyPaymentSignature, fetchPaymentDetails } = await import('@/lib/razorpay/client');
      
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: mockPayment, error: null })
          .mockResolvedValueOnce({
            data: { ...mockPayment, status: 'completed', paid_at: new Date().toISOString() },
            error: null,
          }),
        update: mockUpdate.mockResolvedValue({ error: null }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);
      (verifyPaymentSignature as jest.MockedFunction<typeof verifyPaymentSignature>).mockReturnValue(true);
      (fetchPaymentDetails as jest.MockedFunction<typeof fetchPaymentDetails>).mockResolvedValue({
        id: 'pay_123',
        status: 'captured',
        amount: 50000, // 500 * 100
        method: 'card',
      });

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_sig',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payment.status).toBe('completed');
      expect(data.message).toBe('Payment verified successfully');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
    });

    it('should reject when Razorpay payment status is not captured', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { verifyPaymentSignature, fetchPaymentDetails } = await import('@/lib/razorpay/client');
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);
      (verifyPaymentSignature as jest.MockedFunction<typeof verifyPaymentSignature>).mockReturnValue(true);
      (fetchPaymentDetails as jest.MockedFunction<typeof fetchPaymentDetails>).mockResolvedValue({
        id: 'pay_123',
        status: 'failed',
        amount: 50000,
      });

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_sig',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VERIFICATION_FAILED');
    });

    it('should reject when payment amount does not match', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { verifyPaymentSignature, fetchPaymentDetails } = await import('@/lib/razorpay/client');
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPayment,
          error: null,
        }),
      };
      (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabase as any);
      (verifyPaymentSignature as jest.MockedFunction<typeof verifyPaymentSignature>).mockReturnValue(true);
      (fetchPaymentDetails as jest.MockedFunction<typeof fetchPaymentDetails>).mockResolvedValue({
        id: 'pay_123',
        status: 'captured',
        amount: 100000, // Different amount
        method: 'card',
      });

      const request = createRequest({
        payment_id: 'payment_123',
        razorpay_order_id: 'order_abc123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_sig',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VERIFICATION_FAILED');
      expect(data.error.message).toContain('amount mismatch');
    });
  });
});
