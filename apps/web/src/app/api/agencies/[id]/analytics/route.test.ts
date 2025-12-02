/**
 * Tests for Agency Analytics Dashboard API
 * 
 * Requirements: 10.1, 10.3, 10.4
 */

import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock dependencies BEFORE importing them
jest.mock('@/lib/auth/server');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/demo-data/middleware');
jest.mock('@/lib/demo-data/generator');

import { getUserSession } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { isDemoUser } from '@/lib/demo-data/middleware';
import { generateDashboardData } from '@/lib/demo-data/generator';

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockIsDemoUser = isDemoUser as jest.MockedFunction<typeof isDemoUser>;
const mockGenerateDashboardData = generateDashboardData as jest.MockedFunction<typeof generateDashboardData>;

describe('GET /api/agencies/[id]/analytics', () => {
  const mockAgencyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = 'user-123';

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
    
    // Default: not a demo user
    mockIsDemoUser.mockReturnValue(false);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user does not have agency:read permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'engineer', // Engineer role doesn't have agency:read permission
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if user tries to access another agency data', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: 'different-agency-id',
        role: 'admin',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'admin',
      });
    });

    it('should return 400 for invalid agency ID format', async () => {
      const invalidId = 'not-a-uuid';
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${invalidId}/analytics`
      );
      const params = Promise.resolve({ id: invalidId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });

    it('should return 400 for invalid period parameter', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?period=invalid`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_PARAMETER');
      expect(data.error.message).toContain('Invalid period parameter');
    });

    it('should accept valid period parameters', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const validPeriods = ['1month', '3months', '6months', '1year', 'all'];

      for (const period of validPeriods) {
        const request = new NextRequest(
          `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?period=${period}`
        );
        const params = Promise.resolve({ id: mockAgencyId });

        const response = await GET(request, { params });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Analytics Data Aggregation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'admin',
      });
    });

    it('should return analytics with summary statistics', async () => {
      const mockMonthlyMetrics = [
        {
          agency_id: mockAgencyId,
          month: '2024-07-01',
          jobs_completed: 20,
          total_revenue: 60000,
          avg_rating: 4.5,
          successful_jobs: 19,
          cancelled_jobs: 1,
        },
        {
          agency_id: mockAgencyId,
          month: '2024-08-01',
          jobs_completed: 25,
          total_revenue: 75000,
          avg_rating: 4.7,
          successful_jobs: 24,
          cancelled_jobs: 1,
        },
      ];

      const mockEngineerMetrics = [
        {
          engineer_id: 'eng-1',
          engineer_name: 'John Doe',
          completed_jobs: 15,
          avg_rating: 4.8,
          success_rate: 95,
          availability_status: 'available',
        },
        {
          engineer_id: 'eng-2',
          engineer_name: 'Jane Smith',
          completed_jobs: 12,
          avg_rating: 4.6,
          success_rate: 92,
          availability_status: 'on_job',
        },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agency_monthly_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ 
              data: mockMonthlyMetrics, 
              error: null 
            }),
          };
        } else if (table === 'engineer_performance_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ 
              data: mockEngineerMetrics, 
              error: null 
            }),
          };
        } else if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            }),
          };
        }
        return mockSupabaseClient;
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.agency_id).toBe(mockAgencyId);
      expect(data.summary).toBeDefined();
      expect(data.summary.total_jobs_completed).toBe(45);
      expect(data.summary.total_revenue).toBe(135000);
      expect(data.summary.total_engineers).toBe(2);
      expect(data.summary.active_engineers).toBe(2);
    });

    it('should include chart data when includeCharts is true', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?includeCharts=true`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.charts).toBeDefined();
      expect(data.charts.jobs_trend).toBeDefined();
      expect(data.charts.revenue_trend).toBeDefined();
      expect(data.charts.rating_distribution).toBeDefined();
      expect(data.charts.job_type_distribution).toBeDefined();
      expect(data.charts.engineer_performance).toBeDefined();
    });

    it('should exclude chart data when includeCharts is false', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?includeCharts=false`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.charts).toBeUndefined();
    });

    it('should calculate trends correctly', async () => {
      const mockMonthlyMetrics = [
        {
          month: '2024-07-01',
          jobs_completed: 20,
          total_revenue: 60000,
          avg_rating: 4.5,
        },
        {
          month: '2024-08-01',
          jobs_completed: 25,
          total_revenue: 75000,
          avg_rating: 4.7,
        },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agency_monthly_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ 
              data: mockMonthlyMetrics, 
              error: null 
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.trends).toBeDefined();
      expect(data.trends.jobs_growth).toBe(25); // (25-20)/20 * 100 = 25%
      expect(data.trends.revenue_growth).toBe(25); // (75000-60000)/60000 * 100 = 25%
      expect(data.trends.rating_change).toBe(0.2); // 4.7 - 4.5 = 0.2
    });
  });

  describe('Chart Data Structures', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'admin',
      });
    });

    it('should format jobs trend chart correctly', async () => {
      const mockMonthlyMetrics = [
        {
          month: '2024-08-01',
          jobs_completed: 25,
          successful_jobs: 24,
          cancelled_jobs: 1,
        },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'agency_monthly_metrics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ 
              data: mockMonthlyMetrics, 
              error: null 
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.charts.jobs_trend).toHaveLength(1);
      expect(data.charts.jobs_trend[0]).toEqual({
        month: expect.any(String),
        completed: 24,
        cancelled: 1,
        total: 25,
      });
    });

    it('should format rating distribution correctly', async () => {
      const mockJobs = [
        { client_rating: 5 },
        { client_rating: 5 },
        { client_rating: 4 },
        { client_rating: 3 },
        { client_rating: 2 },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ 
              data: mockJobs, 
              error: null 
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.charts.rating_distribution).toHaveLength(5);
      expect(data.charts.rating_distribution[0]).toEqual({ rating: 5, count: 2 });
      expect(data.charts.rating_distribution[1]).toEqual({ rating: 4, count: 1 });
    });

    it('should format job type distribution with percentages', async () => {
      const mockJobs = [
        { job_type: 'AMC' },
        { job_type: 'AMC' },
        { job_type: 'Repair' },
        { job_type: 'Installation' },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ 
              data: mockJobs, 
              error: null 
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      const amcData = data.charts.job_type_distribution.find((d: any) => d.type === 'AMC');
      expect(amcData.count).toBe(2);
      expect(amcData.percentage).toBe(50);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'admin',
      });
    });

    it('should return 500 if database query fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle missing data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.total_jobs_completed).toBe(0);
      expect(data.summary.total_revenue).toBe(0);
    });
  });

  describe('Demo User Integration', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: mockUserId,
        agency_id: mockAgencyId,
        role: 'admin',
        is_demo_user: true,
      });
    });

    it('should serve generated demo data for demo users', async () => {
      mockIsDemoUser.mockReturnValue(true);
      
      const mockDemoData = {
        summary: {
          total_jobs_completed: 500,
          total_revenue: 2500000,
          avg_rating: 4.5,
          total_engineers: 25,
          active_engineers: 18,
        },
        charts: {
          jobs_trend: [
            { month: 'Jul 2024', completed: 80, cancelled: 5, total: 85 },
            { month: 'Aug 2024', completed: 90, cancelled: 3, total: 93 },
          ],
          revenue_trend: [
            { month: 'Jul 2024', revenue: 400000, avg_job_value: 5000 },
            { month: 'Aug 2024', revenue: 450000, avg_job_value: 5000 },
          ],
          rating_distribution: [
            { rating: 5, count: 50 },
            { rating: 4, count: 30 },
            { rating: 3, count: 10 },
            { rating: 2, count: 5 },
            { rating: 1, count: 5 },
          ],
          job_type_distribution: [
            { type: 'AMC', count: 40, percentage: 40 },
            { type: 'Repair', count: 30, percentage: 30 },
            { type: 'Installation', count: 20, percentage: 20 },
            { type: 'Emergency', count: 10, percentage: 10 },
          ],
        },
        trends: {
          jobs_growth: 15.5,
          revenue_growth: 12.5,
          rating_change: 0.1,
        },
      };

      mockGenerateDashboardData.mockReturnValue(mockDemoData);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockIsDemoUser).toHaveBeenCalled();
      expect(mockGenerateDashboardData).toHaveBeenCalledWith(mockUserId, '6months');
      expect(data.summary).toEqual(mockDemoData.summary);
      expect(data.charts.jobs_trend).toEqual(mockDemoData.charts.jobs_trend);
      expect(data.trends).toEqual(mockDemoData.trends);
      expect(data.agency_id).toBe(mockAgencyId);
      expect(data.period).toBe('6months');
    });

    it('should respect period parameter for demo users', async () => {
      mockIsDemoUser.mockReturnValue(true);
      
      const mockDemoData = {
        summary: {
          total_jobs_completed: 500,
          total_revenue: 2500000,
          avg_rating: 4.5,
          total_engineers: 25,
          active_engineers: 18,
        },
        charts: {
          jobs_trend: [],
          revenue_trend: [],
          rating_distribution: [],
          job_type_distribution: [],
        },
        trends: {
          jobs_growth: 15.5,
          revenue_growth: 12.5,
          rating_change: 0.1,
        },
      };

      mockGenerateDashboardData.mockReturnValue(mockDemoData);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?period=1year`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGenerateDashboardData).toHaveBeenCalledWith(mockUserId, '1year');
      expect(data.period).toBe('1year');
    });

    it('should exclude charts when includeCharts is false for demo users', async () => {
      mockIsDemoUser.mockReturnValue(true);
      
      const mockDemoData = {
        summary: {
          total_jobs_completed: 500,
          total_revenue: 2500000,
          avg_rating: 4.5,
          total_engineers: 25,
          active_engineers: 18,
        },
        charts: {
          jobs_trend: [],
          revenue_trend: [],
          rating_distribution: [],
          job_type_distribution: [],
        },
        trends: {
          jobs_growth: 15.5,
          revenue_growth: 12.5,
          rating_change: 0.1,
        },
      };

      mockGenerateDashboardData.mockReturnValue(mockDemoData);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics?includeCharts=false`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.charts).toBeUndefined();
      expect(data.summary).toBeDefined();
      expect(data.trends).toBeDefined();
    });

    it('should fall back to real data if demo data generation fails', async () => {
      mockIsDemoUser.mockReturnValue(true);
      mockGenerateDashboardData.mockImplementation(() => {
        throw new Error('Demo data generation failed');
      });

      // Mock real data query
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGenerateDashboardData).toHaveBeenCalled();
      // Should fall back to real data query
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should not query database for demo users', async () => {
      mockIsDemoUser.mockReturnValue(true);
      
      const mockDemoData = {
        summary: {
          total_jobs_completed: 500,
          total_revenue: 2500000,
          avg_rating: 4.5,
          total_engineers: 25,
          active_engineers: 18,
        },
        charts: {
          jobs_trend: [],
          revenue_trend: [],
          rating_distribution: [],
          job_type_distribution: [],
        },
        trends: {
          jobs_growth: 15.5,
          revenue_growth: 12.5,
          rating_change: 0.1,
        },
      };

      mockGenerateDashboardData.mockReturnValue(mockDemoData);

      const request = new NextRequest(
        `http://localhost:3000/api/agencies/${mockAgencyId}/analytics`
      );
      const params = Promise.resolve({ id: mockAgencyId });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });
});
