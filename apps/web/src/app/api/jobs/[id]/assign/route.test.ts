/**
 * Job Assignment API Tests
 * Tests for POST /api/jobs/{id}/assign endpoint
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

describe('POST /api/jobs/[id]/assign', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user does not have job:assign permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'viewer',
        agency_id: 'agency-123',
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if user does not have access to the job', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'admin',
        agency_id: 'agency-123',
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          assigned_agency_id: 'agency-456', // Different agency
          status: 'pending',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('do not have access');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'admin',
        agency_id: 'agency-123',
      });
    });

    it('should return 400 for invalid job ID format', async () => {
      const request = new NextRequest('http://localhost/api/jobs/invalid-id/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: 'invalid-id' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });

    it('should return 400 for invalid engineer ID format', async () => {
      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: 'invalid-engineer-id' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details?.engineer_id).toBeDefined();
    });

    it('should return 400 for missing engineer_id', async () => {
      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Job Assignment Logic', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'admin',
        agency_id: 'agency-123',
      });
    });

    it('should return 404 if job does not exist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('Job not found');
    });

    it('should return 409 if job is already assigned', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          assigned_agency_id: 'agency-123',
          assigned_engineer_id: 'existing-engineer-id',
          status: 'assigned',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.message).toContain('already assigned');
    });

    it('should return 404 if engineer does not exist', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
            job_number: 'JOB-2025-1234',
            client_name: 'Test Client',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('Engineer not found');
    });

    it('should return 403 if engineer does not belong to the job agency', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '987fcdeb-51a2-43f7-8765-123456789abc',
            agency_id: 'agency-456', // Different agency
            availability_status: 'available',
          },
          error: null,
        });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('does not belong to the assigned agency');
    });

    // Property 16: Assignment availability validation
    it('should return 409 if engineer is not available (on_job)', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '987fcdeb-51a2-43f7-8765-123456789abc',
            agency_id: 'agency-123',
            availability_status: 'on_job',
          },
          error: null,
        });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.message).toContain('not available');
      expect(data.error.message).toContain('on_job');
    });

    // Property 20: Prevent double assignment
    it('should return 409 if engineer is offline', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '987fcdeb-51a2-43f7-8765-123456789abc',
            agency_id: 'agency-123',
            availability_status: 'offline',
          },
          error: null,
        });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('CONFLICT');
    });

    // Properties 17, 18, 19: Successful assignment
    it('should successfully assign engineer to job', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const engineerId = '987fcdeb-51a2-43f7-8765-123456789abc';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: jobId,
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
            job_number: 'JOB-2025-1234',
            client_name: 'Test Client',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: engineerId,
            agency_id: 'agency-123',
            availability_status: 'available',
            name: 'John Doe',
            phone: '9876543210',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: jobId,
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: engineerId,
            status: 'assigned',
            assigned_at: expect.any(String),
            job_number: 'JOB-2025-1234',
            client_name: 'Test Client',
          },
          error: null,
        });

      mockSupabase.update.mockReturnThis();

      const request = new NextRequest(`http://localhost/api/jobs/${jobId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ engineer_id: engineerId }),
      });

      const params = Promise.resolve({ id: jobId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job).toBeDefined();
      expect(data.job.status).toBe('assigned');
      expect(data.job.assigned_engineer_id).toBe(engineerId);
      expect(data.job.assigned_at).toBeDefined();
      expect(data.engineer).toBeDefined();
      expect(data.engineer.availability_status).toBe('on_job');
      expect(data.assignment).toBeDefined();
      expect(data.notification_sent).toBeDefined();

      // Verify job was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          assigned_engineer_id: engineerId,
          status: 'assigned',
          assigned_at: expect.any(String),
        })
      );

      // Verify engineer status was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          availability_status: 'on_job',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        role: 'admin',
        agency_id: 'agency-123',
      });
    });

    it('should return 500 if database error occurs when fetching job', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign', {
        method: 'POST',
        body: JSON.stringify({ engineer_id: '987fcdeb-51a2-43f7-8765-123456789abc' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should rollback job assignment if engineer update fails', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const engineerId = '987fcdeb-51a2-43f7-8765-123456789abc';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: jobId,
            assigned_agency_id: 'agency-123',
            assigned_engineer_id: null,
            status: 'pending',
            job_number: 'JOB-2025-1234',
            client_name: 'Test Client',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: engineerId,
            agency_id: 'agency-123',
            availability_status: 'available',
            name: 'John Doe',
            phone: '9876543210',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: jobId,
            assigned_engineer_id: engineerId,
            status: 'assigned',
          },
          error: null,
        });

      // Mock successful job update but failed engineer update
      mockSupabase.update
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: { id: jobId, status: 'assigned' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: null,
            error: { message: 'Update failed' },
          }),
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            data: { id: jobId, status: 'pending' },
            error: null,
          }),
        });

      const request = new NextRequest(`http://localhost/api/jobs/${jobId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ engineer_id: engineerId }),
      });

      const params = Promise.resolve({ id: jobId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toContain('Failed to update engineer availability');

      // Verify rollback was attempted
      expect(mockSupabase.update).toHaveBeenCalledTimes(3);
    });
  });
});
