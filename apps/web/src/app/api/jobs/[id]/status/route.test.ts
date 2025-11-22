/**
 * Job Status Management API Tests
 * Tests for PATCH /api/jobs/{id}/status endpoint
 */

import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('PATCH /api/jobs/[id]/status', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase channel
    mockChannel = {
      send: jest.fn().mockResolvedValue({ error: null }),
    };

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      channel: jest.fn().mockReturnValue(mockChannel),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user does not have job:update permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'viewer',
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if agency user tries to update job from different agency', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin',
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          assigned_agency_id: 'agency-456', // Different agency
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toContain('do not have access');
    });

    it('should return 403 if engineer tries to update job assigned to different engineer', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        role: 'engineer',
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          assigned_engineer_id: 'engineer-456', // Different engineer
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toContain('do not have access');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should return 400 if job ID is not a valid UUID', async () => {
      const request = new NextRequest('http://localhost/api/jobs/invalid-id/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: 'invalid-id' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });

    it('should return 400 if status is missing', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          assigned_agency_id: 'agency-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details?.status).toContain('Status is required');
    });

    it('should return 400 if status is invalid', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          assigned_agency_id: 'agency-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid status value');
    });

    it('should return 400 if location coordinates are invalid', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          assigned_agency_id: 'agency-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'travelling',
          location: { lat: 100, lng: 200 }, // Invalid coordinates
        }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid location coordinates');
    });
  });

  describe('Status Transition Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should reject invalid status transition from completed to travelling', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          assigned_agency_id: 'agency-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TRANSITION');
      expect(data.error.message).toContain('Invalid status transition');
    });

    it('should reject invalid status transition from pending to onsite', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'pending',
          assigned_agency_id: 'agency-123',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'onsite' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_TRANSITION');
    });

    it('should allow valid status transition from accepted to travelling', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        agency_id: 'agency-123',
        role: 'admin',
      });

      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
            updated_at: '2025-01-15T10:15:00Z',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'travelling',
          location: { lat: 28.6139, lng: 77.2090 },
        }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.status).toBe('travelling');
    });
  });

  describe('Status History Recording (Requirement 6.1)', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should record status history with location', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
          },
          error: null,
        });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.insert = mockInsert;

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'travelling',
          location: { lat: 28.6139, lng: 77.2090 },
          notes: 'On the way',
        }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      await PATCH(request, { params });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'travelling',
          changed_by: 'engineer-123',
          location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139],
          },
          notes: 'On the way',
        })
      );
    });

    it('should record status history without location if not provided', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'assigned',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
          },
          error: null,
        });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.insert = mockInsert;

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      await PATCH(request, { params });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'accepted',
          changed_by: 'engineer-123',
          notes: null,
        })
      );
      expect(mockInsert).toHaveBeenCalledWith(
        expect.not.objectContaining({
          location: expect.anything(),
        })
      );
    });
  });

  describe('Timestamp Recording (Requirement 6.3)', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should set started_at when status changes to onsite', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'onsite',
            started_at: '2025-01-15T10:30:00Z',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'onsite' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.timestamp_recorded).toBeTruthy();
      expect(data.job.started_at).toBeTruthy();
    });

    it('should set completed_at when status changes to completed', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'onsite',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'completed',
            completed_at: '2025-01-15T12:00:00Z',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.timestamp_recorded).toBeTruthy();
      expect(data.job.completed_at).toBeTruthy();
    });

    it('should set assigned_at when status changes to assigned', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'pending',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'assigned',
            assigned_at: '2025-01-15T09:00:00Z',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'assigned' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.timestamp_recorded).toBeTruthy();
      expect(data.job.assigned_at).toBeTruthy();
    });
  });

  describe('Real-time Broadcast (Requirement 6.4)', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should broadcast status update via Supabase Realtime', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({ error: null });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'travelling',
          location: { lat: 28.6139, lng: 77.2090 },
        }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.channel).toHaveBeenCalledWith('job:123e4567-e89b-12d3-a456-426614174000');
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'status_update',
          payload: expect.objectContaining({
            job_id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
            changed_by: 'engineer-123',
          }),
        })
      );
      expect(data.metadata.realtime_broadcast_sent).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-123',
        agency_id: 'agency-123',
        role: 'admin',
      });
    });

    it('should return 404 if job not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 500 if database error occurs during job fetch', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should return 500 if database error occurs during job update', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'DB_ERROR', message: 'Update failed' },
        });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should continue if status history recording fails', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'accepted',
            assigned_agency_id: 'agency-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'travelling',
          },
          error: null,
        });

      mockSupabase.insert.mockResolvedValue({
        error: { code: 'DB_ERROR', message: 'Insert failed' },
      });

      const request = new NextRequest('http://localhost/api/jobs/123e4567-e89b-12d3-a456-426614174000/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'travelling' }),
      });

      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      const response = await PATCH(request, { params });

      // Should still succeed even if history recording fails
      expect(response.status).toBe(200);
    });
  });
});
