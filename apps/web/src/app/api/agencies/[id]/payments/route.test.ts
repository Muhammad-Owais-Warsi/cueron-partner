/**
 * Tests for Agency Payments API
 * 
 * Tests payment listing, status updates, and Razorpay integration
 */

import { NextRequest } from 'next/server';
import { GET, PATCH, POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('GET /api/agencies/[id]/payments', () => {
  const agencyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSession = {
    user_id: 'user-123',
    agency_id: agencyId,
    role: 'admin' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserSession.mockResolvedValue(mockSession);
  });

  it('should return payments for an agency', async () => {
    const mockPayments = [
      {
        id: 'payment-1',
        agency_id: agencyId,
        job_id: 'job-1',
        amount: 5000.00,
        payment_type: 'job_payment',
        status: 'completed',
        payment_method: 'razorpay',
        created_at: '2025-01-15T09:00:00Z',
        updated_at: '2025-01-15T10:30:00Z',
      },
      {
        id: 'payment-2',
        agency_id: agencyId,
        job_id: 'job-2',
        amount: 3000.00,
        payment_type: 'job_payment',
        status: 'pending',
        created_at: '2025-01-14T09:00:00Z',
        updated_at: '2025-01-14T09:00:00Z',
      },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockPayments,
        error: null,
        count: 2,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.payments).toHaveLength(2);
    expect(data.payments[0].id).toBe('payment-1');
    expect(data.pagination.total).toBe(2);
  });

  // Feature: cueron-partner-platform, Property 48: Payment list isolation
  it('should only return payments for the requesting agency', async () => {
    const mockPayments = [
      {
        id: 'payment-1',
        agency_id: agencyId,
        amount: 5000.00,
        status: 'completed',
      },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockPayments,
        error: null,
        count: 1,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`
    );

    await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    // Verify that the query filters by agency_id
    expect(mockSupabase.eq).toHaveBeenCalledWith('agency_id', agencyId);
  });

  it('should filter payments by status', async () => {
    const mockPayments = [
      {
        id: 'payment-1',
        agency_id: agencyId,
        status: 'pending',
      },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockPayments,
        error: null,
        count: 1,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments?status=pending,processing`
    );

    await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(mockSupabase.in).toHaveBeenCalledWith('status', ['pending', 'processing']);
  });

  it('should filter payments by date range', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const dateFrom = '2025-01-01T00:00:00Z';
    const dateTo = '2025-01-31T23:59:59Z';

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments?date_from=${dateFrom}&date_to=${dateTo}`
    );

    await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', dateFrom);
    expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', dateTo);
  });

  it('should reject access to another agency payments', async () => {
    const otherAgencyId = '987e6543-e21b-12d3-a456-426614174999';
    
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${otherAgencyId}/payments`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: otherAgencyId }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should validate invalid status filter', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments?status=invalid_status`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_FILTER');
  });

  it('should handle pagination correctly', async () => {
    const mockPayments = Array.from({ length: 5 }, (_, i) => ({
      id: `payment-${i}`,
      agency_id: agencyId,
      amount: 1000 * (i + 1),
      status: 'completed',
    }));

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockPayments.slice(0, 3),
        error: null,
        count: 5,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments?page=1&limit=3`
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    const data = await response.json();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(3);
    expect(data.pagination.total).toBe(5);
    expect(data.pagination.total_pages).toBe(2);
    expect(data.pagination.has_next).toBe(true);
    expect(data.pagination.has_prev).toBe(false);
  });
});

describe('PATCH /api/agencies/[id]/payments', () => {
  const agencyId = '123e4567-e89b-12d3-a456-426614174000';
  const paymentId = 'payment-123';
  const mockSession = {
    user_id: 'user-123',
    agency_id: agencyId,
    role: 'admin' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserSession.mockResolvedValue(mockSession);
  });

  // Feature: cueron-partner-platform, Property 50: Payment processing update
  it('should update payment status and record paid_at timestamp', async () => {
    const existingPayment = {
      id: paymentId,
      agency_id: agencyId,
      status: 'processing',
      paid_at: null,
    };

    const updatedPayment = {
      ...existingPayment,
      status: 'completed',
      paid_at: expect.any(String),
      updated_at: expect.any(String),
    };

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingPayment,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    };

    // Mock the update chain
    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: updatedPayment,
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          payment_id: paymentId,
          status: 'completed',
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.payment.status).toBe('completed');
    expect(data.payment.paid_at).toBeDefined();
  });

  it('should update payment with gateway ID and invoice details', async () => {
    const existingPayment = {
      id: paymentId,
      agency_id: agencyId,
      status: 'processing',
    };

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingPayment,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    };

    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...existingPayment,
          payment_gateway_id: 'pay_xyz123',
          invoice_number: 'INV-2025-001',
          invoice_url: 'https://example.com/invoice.pdf',
        },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          payment_id: paymentId,
          payment_gateway_id: 'pay_xyz123',
          invoice_number: 'INV-2025-001',
          invoice_url: 'https://example.com/invoice.pdf',
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.payment.payment_gateway_id).toBe('pay_xyz123');
    expect(data.payment.invoice_number).toBe('INV-2025-001');
  });

  it('should reject update for payment not belonging to agency', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          payment_id: paymentId,
          status: 'completed',
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should validate payment_id is required', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate invalid status value', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          payment_id: paymentId,
          status: 'invalid_status',
        }),
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/agencies/[id]/payments', () => {
  const agencyId = '123e4567-e89b-12d3-a456-426614174000';
  const paymentId = 'payment-123';
  const mockSession = {
    user_id: 'user-123',
    agency_id: agencyId,
    role: 'admin' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserSession.mockResolvedValue(mockSession);
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'secret_123';
  });

  it('should create Razorpay payment order', async () => {
    const existingPayment = {
      id: paymentId,
      agency_id: agencyId,
      status: 'pending',
      amount: 5000.00,
    };

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingPayment,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    };

    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...existingPayment,
          status: 'processing',
          payment_method: 'razorpay',
          payment_gateway_id: expect.any(String),
        },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount: 5000.00,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.order_id).toBeDefined();
    expect(data.amount).toBe(5000.00);
    expect(data.currency).toBe('INR');
    expect(data.key_id).toBe('rzp_test_123');
    expect(data.payment.status).toBe('processing');
  });

  it('should reject if payment already completed', async () => {
    const existingPayment = {
      id: paymentId,
      agency_id: agencyId,
      status: 'completed',
    };

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingPayment,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount: 5000.00,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_STATE');
  });

  it('should validate amount is positive', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount: -100,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return error if Razorpay not configured', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    // No need to mock Supabase since we should fail before reaching database
    const request = new NextRequest(
      `http://localhost:3000/api/agencies/${agencyId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          amount: 5000.00,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: agencyId }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.code).toBe('CONFIGURATION_ERROR');
  });
});
