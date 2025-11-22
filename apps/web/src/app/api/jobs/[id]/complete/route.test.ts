/**
 * Job Completion API Route Tests
 * Tests for POST /api/jobs/{id}/complete
 */

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('POST /api/jobs/[id]/complete', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client with proper chaining
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      channel: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue(undefined),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);

    // Mock request
    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest;
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user does not have job:write permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'viewer',
        agency_id: 'agency-123',
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if agency user tries to complete job from another agency', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'manager',
        agency_id: 'agency-123',
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          job_number: 'JOB-2025-1234',
          status: 'onsite',
          assigned_agency_id: 'agency-456', // Different agency
          assigned_engineer_id: 'engineer-123',
          service_fee: 2500,
        },
        error: null,
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if engineer tries to complete job assigned to another engineer', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-456',
        role: 'engineer',
        agency_id: null,
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          job_number: 'JOB-2025-1234',
          status: 'onsite',
          assigned_agency_id: 'agency-123',
          assigned_engineer_id: 'engineer-123', // Different engineer
          service_fee: 2500,
        },
        error: null,
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
        agency_id: null,
      });
    });

    it('should return 400 if job ID is not a valid UUID', async () => {
      const params = Promise.resolve({ id: 'invalid-id' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });

    it('should return 400 if signature_url is missing', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({});

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveProperty('signature_url');
    });

    it('should return 400 if signature_url is not a valid URL', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'not-a-url',
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toHaveProperty('signature_url');
    });

    it('should return 400 if checklist items have invalid structure', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
        checklist: [
          { item: 'Check levels', completed: 'yes' }, // Invalid: completed should be boolean
        ],
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if parts_used have invalid quantities', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
        parts_used: [
          { name: 'Part A', quantity: -1, cost: 100 }, // Invalid: negative quantity
        ],
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Job Status Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
        agency_id: null,
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });
    });

    it('should return 404 if job does not exist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 409 if job is already completed', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          assigned_engineer_id: 'engineer-123',
        },
        error: null,
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.message).toContain('already completed');
    });

    it('should return 409 if job is cancelled', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'cancelled',
          assigned_engineer_id: 'engineer-123',
        },
        error: null,
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.message).toContain('cancelled');
    });
  });

  describe('Checklist Validation (Requirement 8.1)', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
        agency_id: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          job_number: 'JOB-2025-1234',
          status: 'onsite',
          assigned_engineer_id: 'engineer-123',
          assigned_agency_id: 'agency-123',
          service_fee: 2500,
        },
        error: null,
      });
    });

    it('should return 400 if checklist has incomplete items', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
        checklist: [
          { item: 'Check levels', completed: true },
          { item: 'Inspect connections', completed: false }, // Incomplete
        ],
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('checklist item(s) are incomplete');
    });

    it('should succeed if all checklist items are completed', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
        checklist: [
          { item: 'Check levels', completed: true },
          { item: 'Inspect connections', completed: true },
        ],
      });

      // Mock successful job update
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
            completed_at: new Date().toISOString(),
          },
          error: null,
        });

      // Mock engineer update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Mock payment creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'payment-123', status: 'pending' },
        error: null,
      });

      // Mock status history
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.checklist_validated).toBe(true);
    });

    it('should succeed if no checklist is provided', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });

      // Mock successful job update
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
            completed_at: new Date().toISOString(),
          },
          error: null,
        });

      // Mock engineer update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Mock payment creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'payment-123', status: 'pending' },
        error: null,
      });

      // Mock status history
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.checklist_validated).toBe(false);
    });
  });

  describe('Successful Job Completion', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
        agency_id: null,
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
        checklist: [
          { item: 'Check levels', completed: true, notes: 'All good' },
        ],
        parts_used: [
          { name: 'Refrigerant', quantity: 2, cost: 500 },
        ],
        engineer_notes: 'Service completed successfully',
      });

      // Mock job fetch
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            job_number: 'JOB-2025-1234',
            status: 'onsite',
            assigned_engineer_id: 'engineer-123',
            assigned_agency_id: 'agency-123',
            service_fee: 2500,
          },
          error: null,
        })
        // Mock job update
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
            completed_at: '2025-01-15T14:30:00Z',
            client_signature_url: 'https://storage.supabase.co/signatures/sig.png',
          },
          error: null,
        })
        // Mock payment creation
        .mockResolvedValueOnce({
          data: {
            id: 'payment-123',
            job_id: '123e4567-e89b-12d3-a456-426614174000',
            agency_id: 'agency-123',
            amount: 2500,
            status: 'pending',
          },
          error: null,
        });

      // Mock engineer update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Mock status history
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
    });

    it('should complete job successfully (Requirement 8.4)', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.status).toBe('completed');
      expect(data.job.completed_at).toBeDefined();
    });

    it('should upload signature (Requirement 8.3)', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.client_signature_url).toBe('https://storage.supabase.co/signatures/sig.png');
      expect(data.metadata.signature_uploaded).toBe(true);
    });

    it('should restore engineer availability (Requirement 8.5)', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.engineer_availability_restored).toBe(true);

      // Verify engineer update was called
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          availability_status: 'available',
        })
      );
    });

    it('should create payment record (Requirement 11.2)', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payment).toBeDefined();
      expect(data.payment.status).toBe('pending');
      expect(data.payment.amount).toBe(2500);
      expect(data.metadata.payment_created).toBe(true);
    });

    it('should include all provided data in job update', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify update was called with all fields
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          client_signature_url: 'https://storage.supabase.co/signatures/sig.png',
          service_checklist: expect.any(Array),
          parts_used: expect.any(Array),
          engineer_notes: 'Service completed successfully',
        })
      );
    });

    it('should broadcast completion via realtime', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });

      expect(response.status).toBe(200);
      expect(mockSupabase.channel).toHaveBeenCalledWith('job:123e4567-e89b-12d3-a456-426614174000');
    });

    it('should stop location tracking for engineer', async () => {
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });

      expect(response.status).toBe(200);
      expect(mockSupabase.channel).toHaveBeenCalledWith('engineer:engineer-123');
    });
  });

  describe('Payment Creation Edge Cases', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
        agency_id: null,
      });

      (mockRequest.json as jest.Mock).mockResolvedValue({
        signature_url: 'https://storage.supabase.co/signatures/sig.png',
      });
    });

    it('should not create payment if service_fee is 0', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'onsite',
            assigned_engineer_id: 'engineer-123',
            assigned_agency_id: 'agency-123',
            service_fee: 0, // No fee
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
          },
          error: null,
        });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payment).toBeNull();
      expect(data.metadata.payment_created).toBe(false);
    });

    it('should not create payment if service_fee is undefined', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'onsite',
            assigned_engineer_id: 'engineer-123',
            assigned_agency_id: 'agency-123',
            service_fee: undefined,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
          },
          error: null,
        });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payment).toBeNull();
      expect(data.metadata.payment_created).toBe(false);
    });

    it('should succeed even if payment creation fails', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'onsite',
            assigned_engineer_id: 'engineer-123',
            assigned_agency_id: 'agency-123',
            service_fee: 2500,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Payment creation failed' },
        });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(mockRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.status).toBe('completed');
      expect(data.payment).toBeNull();
    });
  });
});
