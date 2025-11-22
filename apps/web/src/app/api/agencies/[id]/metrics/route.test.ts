/**
 * Agency Metrics and Analytics API Tests
 * Tests for GET /api/agencies/{id}/metrics
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

describe('GET /api/agencies/[id]/metrics', () => {
  const mockAgencyId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid agency ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/agencies/invalid-id/metrics');
    const params = Promise.resolve({ id: 'invalid-id' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ID');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}/metrics`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 if user does not have agency:read permission', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'engineer',
      agency_id: mockAgencyId,
    });

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}/metrics`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return comprehensive metrics data', async () => {
    const mockMonthlyMetrics = [
      {
        agency_id: mockAgencyId,
        agency_name: 'Test Agency',
        month: '2025-01-01T00:00:00Z',
        jobs_completed: 50,
        engineers_utilized: 10,
        total_revenue: 100000,
        avg_rating: 4.5,
        last_refreshed: '2025-01-15T10:00:00Z',
      },
    ];

    const mockCurrentMetrics = {
      agency_id: mockAgencyId,
      jobs_today: 5,
      active_engineers: 8,
      monthly_revenue: 100000,
      monthly_avg_rating: 4.5,
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      from: jest.fn((table: string) => {
        if (table === 'agency_monthly_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockMonthlyMetrics,
              error: null,
            }),
          };
        } else if (table === 'dashboard_realtime') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockCurrentMetrics,
              error: null,
            }),
          };
        } else if (table === 'engineer_performance_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
        };
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}/metrics`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agency_id).toBe(mockAgencyId);
    expect(data.period).toBe('monthly');
    expect(data.current_month).toBeDefined();
    expect(data.monthly_metrics).toHaveLength(1);
  });
});
