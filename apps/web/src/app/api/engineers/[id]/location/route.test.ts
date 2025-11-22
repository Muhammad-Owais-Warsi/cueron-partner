import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('PATCH /api/engineers/[id]/location', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 400 if latitude is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.latitude).toBeDefined();
    });

    it('should return 400 if longitude is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.longitude).toBeDefined();
    });

    it('should return 400 if latitude is out of range', async () => {
      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 91, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if longitude is out of range', async () => {
      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 181 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if engineer does not exist', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 if user does not own the engineer profile', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '123',
            user_id: 'different-user',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockFrom);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Location Update', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should successfully update location with PostGIS POINT format', async () => {
      const engineerId = '123e4567-e89b-12d3-a456-426614174000';
      const latitude = 28.6139;
      const longitude = 77.2090;

      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            user_id: 'user-123',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            current_location: `POINT(${longitude} ${latitude})`,
            last_location_update: '2025-01-15T10:30:00.000Z',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude }),
      });

      const response = await PATCH(request, { params: { id: engineerId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(engineerId);
      expect(data.data.current_location).toBe(`POINT(${longitude} ${latitude})`);
      expect(data.data.last_location_update).toBeDefined();
      expect(data.data.availability_status).toBe('on_job');

      // Verify PostGIS POINT format uses longitude first, then latitude
      expect(mockUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_location: `POINT(${longitude} ${latitude})`,
        })
      );
    });

    it('should record timestamp when updating location', async () => {
      const engineerId = '123e4567-e89b-12d3-a456-426614174000';

      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            user_id: 'user-123',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            current_location: 'POINT(77.2090 28.6139)',
            last_location_update: '2025-01-15T10:30:00.000Z',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: engineerId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.last_location_update).toBeDefined();

      // Verify last_location_update was set
      expect(mockUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          last_location_update: expect.any(String),
        })
      );
    });

    it('should handle database update errors gracefully', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: '123',
            user_id: 'user-123',
            availability_status: 'on_job',
          },
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: '123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('UPDATE_FAILED');
    });
  });

  describe('Location Persistence', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should persist location even when engineer goes offline', async () => {
      const engineerId = '123e4567-e89b-12d3-a456-426614174000';

      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            user_id: 'user-123',
            availability_status: 'offline', // Engineer is offline
          },
          error: null,
        }),
      };

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: engineerId,
            current_location: 'POINT(77.2090 28.6139)',
            last_location_update: '2025-01-15T10:30:00.000Z',
            availability_status: 'offline',
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain);

      const request = new NextRequest('http://localhost:3000/api/engineers/123/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 }),
      });

      const response = await PATCH(request, { params: { id: engineerId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.current_location).toBeDefined();
      expect(data.data.last_location_update).toBeDefined();
      // Location is persisted even when offline
    });
  });
});
