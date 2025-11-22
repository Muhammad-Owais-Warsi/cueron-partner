/**
 * Service Checklist Management API Tests
 * Tests for GET and PATCH /api/jobs/{id}/checklist
 */

import { GET, PATCH } from './route';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('GET /api/jobs/[id]/checklist', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return checklist with completion stats for engineer', async () => {
    // Mock session
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'onsite',
          assigned_engineer_id: 'engineer-1',
          assigned_agency_id: 'agency-1',
          service_checklist: [
            { item: 'Check refrigerant levels', completed: true, notes: 'Normal' },
            { item: 'Inspect compressor', completed: false },
            { item: 'Test thermostat', completed: true },
          ],
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    // Create request
    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    // Execute
    const response = await GET(request, { params });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.job_id).toBe(mockJobId);
    expect(data.checklist).toHaveLength(3);
    expect(data.stats).toEqual({
      total_items: 3,
      completed_items: 2,
      pending_items: 1,
      completion_percentage: 67,
      all_completed: false,
    });
    expect(data.completion_enabled).toBe(false);
  });

  it('should enable completion when all items are completed', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'onsite',
          assigned_engineer_id: 'engineer-1',
          assigned_agency_id: 'agency-1',
          service_checklist: [
            { item: 'Check refrigerant levels', completed: true },
            { item: 'Inspect compressor', completed: true },
          ],
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.all_completed).toBe(true);
    expect(data.completion_enabled).toBe(true);
    expect(data.can_complete_job).toBe(true);
  });

  it('should return empty checklist if not set', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'assigned',
          assigned_engineer_id: 'engineer-1',
          assigned_agency_id: 'agency-1',
          service_checklist: null,
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checklist).toEqual([]);
    expect(data.stats.total_items).toBe(0);
    expect(data.completion_enabled).toBe(false);
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 if engineer tries to access another engineer\'s job', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-2',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'onsite',
          assigned_engineer_id: 'engineer-1',
          assigned_agency_id: 'agency-1',
          service_checklist: [],
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 404 if job not found', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`);
    const params = Promise.resolve({ id: mockJobId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/jobs/[id]/checklist', () => {
  const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update checklist successfully', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const updatedChecklist = [
      { item: 'Check refrigerant levels', completed: true, notes: 'Normal' },
      { item: 'Inspect compressor', completed: true, notes: 'No issues' },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: {
            id: mockJobId,
            status: 'onsite',
            assigned_engineer_id: 'engineer-1',
            service_checklist: [
              { item: 'Check refrigerant levels', completed: false },
              { item: 'Inspect compressor', completed: false },
            ],
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: mockJobId,
            status: 'onsite',
            service_checklist: updatedChecklist,
          },
          error: null,
        }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist: updatedChecklist }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checklist).toEqual(updatedChecklist);
    expect(data.stats.all_completed).toBe(true);
    expect(data.completion_enabled).toBe(true);
    expect(data.message).toContain('Job completion is now enabled');
  });

  it('should validate checklist structure', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const invalidChecklist = [
      { item: '', completed: true }, // Empty item
      { item: 'Valid item', completed: 'not-boolean' }, // Invalid completed type
    ];

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist: invalidChecklist }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details.checklist).toBeDefined();
  });

  it('should reject update if job status is not onsite', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'assigned',
          assigned_engineer_id: 'engineer-1',
          service_checklist: [],
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({
        checklist: [{ item: 'Test', completed: true }],
      }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_STATUS');
  });

  it('should reject update if not engineer role', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'admin-1',
      role: 'admin',
      agency_id: 'agency-1',
    });

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({
        checklist: [{ item: 'Test', completed: true }],
      }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
    expect(data.error.message).toContain('Only engineers');
  });

  it('should reject update if engineer not assigned to job', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-2',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: mockJobId,
          status: 'onsite',
          assigned_engineer_id: 'engineer-1',
          service_checklist: [],
        },
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({
        checklist: [{ item: 'Test', completed: true }],
      }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should handle partial completion correctly', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'engineer-1',
      role: 'engineer',
      agency_id: 'agency-1',
    });

    const partialChecklist = [
      { item: 'Check refrigerant levels', completed: true },
      { item: 'Inspect compressor', completed: false },
      { item: 'Test thermostat', completed: true },
    ];

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: {
            id: mockJobId,
            status: 'onsite',
            assigned_engineer_id: 'engineer-1',
            service_checklist: [],
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: mockJobId,
            status: 'onsite',
            service_checklist: partialChecklist,
          },
          error: null,
        }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost/api/jobs/${mockJobId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist: partialChecklist }),
    });
    const params = Promise.resolve({ id: mockJobId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toEqual({
      total_items: 3,
      completed_items: 2,
      pending_items: 1,
      completion_percentage: 67,
      all_completed: false,
    });
    expect(data.completion_enabled).toBe(false);
    expect(data.message).toContain('Complete all items');
  });
});
