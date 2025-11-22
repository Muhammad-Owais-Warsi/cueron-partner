/**
 * Tests for Agency Jobs Listing and Filtering API
 * 
 * Tests cover:
 * - Agency job isolation (Property 11)
 * - Job list sorting (Property 13)
 * - Filter criteria matching (Property 82)
 * - Status filter accuracy (Property 83)
 * - Date range filter accuracy (Property 84)
 * - Spatial filter accuracy (Property 85)
 * - Multi-filter combination (Property 86)
 */

import { GET } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('GET /api/agencies/[id]/jobs', () => {
  const mockAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSession = {
    user_id: 'user-123',
    agency_id: mockAgencyId,
    role: 'admin' as const,
  };

  const mockJobs = [
    {
      id: 'job-1',
      job_number: 'JOB-2025-0001',
      client_name: 'Client A',
      client_phone: '9876543210',
      job_type: 'Emergency',
      equipment_type: 'Chiller',
      site_location: { address: 'Location A', city: 'Delhi', state: 'Delhi', lat: 28.6, lng: 77.2 },
      assigned_agency_id: mockAgencyId,
      required_skill_level: 4,
      scheduled_time: '2025-01-20T10:00:00Z',
      urgency: 'emergency',
      status: 'pending',
      payment_status: 'pending',
      created_at: '2025-01-19T10:00:00Z',
      updated_at: '2025-01-19T10:00:00Z',
    },
    {
      id: 'job-2',
      job_number: 'JOB-2025-0002',
      client_name: 'Client B',
      client_phone: '9876543211',
      job_type: 'AMC',
      equipment_type: 'HVAC',
      site_location: { address: 'Location B', city: 'Mumbai', state: 'Maharashtra', lat: 19.0, lng: 72.8 },
      assigned_agency_id: mockAgencyId,
      required_skill_level: 3,
      scheduled_time: '2025-01-21T14:00:00Z',
      urgency: 'normal',
      status: 'assigned',
      payment_status: 'pending',
      created_at: '2025-01-19T11:00:00Z',
      updated_at: '2025-01-19T11:00:00Z',
    },
    {
      id: 'job-3',
      job_number: 'JOB-2025-0003',
      client_name: 'Client C',
      client_phone: '9876543212',
      job_type: 'Repair',
      equipment_type: 'Compressor',
      site_location: { address: 'Location C', city: 'Delhi', state: 'Delhi', lat: 28.7, lng: 77.1 },
      assigned_agency_id: mockAgencyId,
      required_skill_level: 5,
      scheduled_time: '2025-01-20T09:00:00Z',
      urgency: 'urgent',
      status: 'pending',
      payment_status: 'pending',
      created_at: '2025-01-19T12:00:00Z',
      updated_at: '2025-01-19T12:00:00Z',
    },
  ];

  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetUserSession.mockResolvedValue(mockSession);

    // Create a chainable query builder that resolves to data
    mockQueryBuilder = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };

    // Make the query builder awaitable - default to returning mockJobs
    mockQueryBuilder.then = jest.fn((resolve: any) => {
      return Promise.resolve({
        data: mockJobs,
        error: null,
        count: mockJobs.length,
      }).then(resolve);
    });

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockQueryBuilder),
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user tries to access another agency data', async () => {
      const differentAgencyId = '660e8400-e29b-41d4-a716-446655440000';

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${differentAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: differentAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${invalidId}/jobs`
      );
      const params = Promise.resolve({ id: invalidId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });
  });

  describe('Property 11: Agency job isolation', () => {
    it('should only return jobs assigned to the requesting agency', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('assigned_agency_id', mockAgencyId);
      
      // Verify all returned jobs belong to the agency
      data.jobs.forEach((job: any) => {
        expect(job.assigned_agency_id).toBe(mockAgencyId);
      });
    });
  });

  describe('Property 13: Job list sorting', () => {
    it('should sort jobs by urgency (emergency > urgent > normal > scheduled) then by scheduled time', async () => {
      // Default mock already returns mockJobs
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs.length).toBe(3);

      // Verify sorting: emergency first, then urgent, then normal
      expect(data.jobs[0].urgency).toBe('emergency');
      expect(data.jobs[1].urgency).toBe('urgent');
      expect(data.jobs[2].urgency).toBe('normal');

      // Verify within same urgency, earlier scheduled time comes first
      // job-1 (emergency, 10:00) should come before any urgent jobs
      expect(data.jobs[0].id).toBe('job-1');
      // job-3 (urgent, 09:00) should come next
      expect(data.jobs[1].id).toBe('job-3');
    });

    it('should sort jobs with same urgency by scheduled time', async () => {
      const sameUrgencyJobs = [
        {
          ...mockJobs[0],
          id: 'job-a',
          urgency: 'normal',
          scheduled_time: '2025-01-22T10:00:00Z',
        },
        {
          ...mockJobs[1],
          id: 'job-b',
          urgency: 'normal',
          scheduled_time: '2025-01-21T10:00:00Z',
        },
        {
          ...mockJobs[2],
          id: 'job-c',
          urgency: 'normal',
          scheduled_time: '2025-01-20T10:00:00Z',
        },
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: sameUrgencyJobs,
        error: null,
        count: sameUrgencyJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // All should be normal urgency, sorted by time (earliest first)
      expect(data.jobs[0].id).toBe('job-c'); // Jan 20
      expect(data.jobs[1].id).toBe('job-b'); // Jan 21
      expect(data.jobs[2].id).toBe('job-a'); // Jan 22
    });
  });

  describe('Property 83: Status filter accuracy', () => {
    it('should filter jobs by single status', async () => {
      const pendingJobs = mockJobs.filter(j => j.status === 'pending');
      
      mockSupabaseClient.select.mockResolvedValue({
        data: pendingJobs,
        error: null,
        count: pendingJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?status=pending`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['pending']);
      
      // Verify all returned jobs have pending status
      data.jobs.forEach((job: any) => {
        expect(job.status).toBe('pending');
      });
    });

    it('should filter jobs by multiple statuses', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: mockJobs,
        error: null,
        count: mockJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?status=pending,assigned`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['pending', 'assigned']);
    });

    it('should return 400 for invalid status values', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?status=invalid_status`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILTER');
      expect(data.error.message).toContain('Invalid status values');
    });
  });

  describe('Property 84: Date range filter accuracy', () => {
    it('should filter jobs by date_from', async () => {
      const dateFrom = '2025-01-20T00:00:00Z';
      const filteredJobs = mockJobs.filter(
        j => new Date(j.scheduled_time) >= new Date(dateFrom)
      );

      mockSupabaseClient.select.mockResolvedValue({
        data: filteredJobs,
        error: null,
        count: filteredJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?date_from=${dateFrom}`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('scheduled_time', dateFrom);
    });

    it('should filter jobs by date_to', async () => {
      const dateTo = '2025-01-20T23:59:59Z';
      const filteredJobs = mockJobs.filter(
        j => new Date(j.scheduled_time) <= new Date(dateTo)
      );

      mockSupabaseClient.select.mockResolvedValue({
        data: filteredJobs,
        error: null,
        count: filteredJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?date_to=${dateTo}`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('scheduled_time', dateTo);
    });

    it('should filter jobs by date range (date_from and date_to)', async () => {
      const dateFrom = '2025-01-20T00:00:00Z';
      const dateTo = '2025-01-21T23:59:59Z';

      mockSupabaseClient.select.mockResolvedValue({
        data: mockJobs,
        error: null,
        count: mockJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?date_from=${dateFrom}&date_to=${dateTo}`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('scheduled_time', dateFrom);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('scheduled_time', dateTo);
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?date_from=invalid-date`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILTER');
      expect(data.error.message).toContain('Invalid date_from format');
    });
  });

  describe('Property 85: Spatial filter accuracy', () => {
    it('should filter jobs by location using PostGIS', async () => {
      const lat = 28.6;
      const lng = 77.2;
      const radiusKm = 50;

      mockSupabaseClient.select.mockResolvedValue({
        data: mockJobs,
        error: null,
        count: mockJobs.length,
      });

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ id: 'job-1' }, { id: 'job-3' }],
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?location_lat=${lat}&location_lng=${lng}&location_radius_km=${radiusKm}`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'filter_jobs_by_location',
        expect.objectContaining({
          p_agency_id: mockAgencyId,
          p_lat: lat,
          p_lng: lng,
          p_radius_meters: radiusKm * 1000,
        })
      );
    });

    it('should return 400 for invalid latitude', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?location_lat=invalid&location_lng=77.2&location_radius_km=50`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILTER');
    });

    it('should return 400 for latitude out of range', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?location_lat=100&location_lng=77.2&location_radius_km=50`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILTER');
      expect(data.error.message).toContain('location_lat');
    });
  });

  describe('Property 86: Multi-filter combination', () => {
    it('should combine multiple filters with AND logic', async () => {
      const filteredJobs = [mockJobs[0]]; // Only emergency + pending

      mockSupabaseClient.select.mockResolvedValue({
        data: filteredJobs,
        error: null,
        count: filteredJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?status=pending&urgency=emergency&date_from=2025-01-20T00:00:00Z`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['pending']);
      expect(mockSupabaseClient.in).toHaveBeenCalledWith('urgency', ['emergency']);
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('scheduled_time', '2025-01-20T00:00:00Z');

      // Verify all filters are applied
      expect(data.filters_applied.status).toEqual(['pending']);
      expect(data.filters_applied.urgency).toEqual(['emergency']);
      expect(data.filters_applied.date_from).toBe('2025-01-20T00:00:00Z');
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const manyJobs = Array.from({ length: 50 }, (_, i) => ({
        ...mockJobs[0],
        id: `job-${i}`,
        job_number: `JOB-2025-${String(i).padStart(4, '0')}`,
      }));

      mockSupabaseClient.select.mockResolvedValue({
        data: manyJobs,
        error: null,
        count: manyJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?page=2&limit=10`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs.length).toBe(10);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(50);
      expect(data.pagination.total_pages).toBe(5);
      expect(data.pagination.has_next).toBe(true);
      expect(data.pagination.has_prev).toBe(true);
    });

    it('should enforce maximum limit of 100', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: mockJobs,
        error: null,
        count: mockJobs.length,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs?limit=200`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(100); // Capped at 100
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
        count: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/jobs`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });
});
