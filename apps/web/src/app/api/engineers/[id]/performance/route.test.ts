/**
 * Engineer Performance Tracking API Tests
 * Tests for GET /api/engineers/{id}/performance
 */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');
jest.mock('@cueron/utils/src/authorization', () => ({
  hasPermission: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const { hasPermission } = require('@cueron/utils/src/authorization');

describe('GET /api/engineers/[id]/performance', () => {
  const mockEngineerId = '123e4567-e89b-12d3-a456-426614174000';
  const mockAgencyId = '987e6543-e21b-12d3-a456-426614174000';

  const mockEngineer = {
    id: mockEngineerId,
    agency_id: mockAgencyId,
    name: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    certifications: [
      {
        type: 'PMKVY',
        level: 3,
        cert_number: 'PMKVY-2024-12345',
        verified: true,
        issued_date: '2024-06-15T00:00:00Z',
      },
    ],
    skill_level: 4,
    specializations: ['Cold Storage', 'Industrial HVAC'],
    availability_status: 'available',
    employment_type: 'full_time',
    total_jobs_completed: 45,
    average_rating: 4.67,
    total_ratings: 42,
    success_rate: 93.75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z',
  };

  const mockCompletedJobs = [
    {
      id: 'job1',
      job_number: 'JOB-2025-1234',
      job_type: 'AMC',
      client_name: 'ABC Cold Storage',
      assigned_engineer_id: mockEngineerId,
      status: 'completed',
      completed_at: '2025-01-15T10:30:00Z',
      client_rating: 5,
      client_feedback: 'Excellent service',
      service_fee: 3000,
      site_location: {
        address: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
    },
    {
      id: 'job2',
      job_number: 'JOB-2025-1235',
      job_type: 'Repair',
      client_name: 'XYZ Warehouse',
      assigned_engineer_id: mockEngineerId,
      status: 'completed',
      completed_at: '2025-01-10T14:20:00Z',
      client_rating: 4,
      client_feedback: 'Good work',
      service_fee: 2500,
      site_location: {
        address: '456 Park Ave',
        city: 'Delhi',
        state: 'Delhi',
      },
    },
    {
      id: 'job3',
      job_number: 'JOB-2025-1236',
      job_type: 'AMC',
      client_name: 'DEF Storage',
      assigned_engineer_id: mockEngineerId,
      status: 'cancelled',
      completed_at: '2025-01-08T09:15:00Z',
      client_rating: null,
      client_feedback: null,
      service_fee: 0,
      site_location: {
        address: '789 Oak St',
        city: 'Bangalore',
        state: 'Karnataka',
      },
    },
  ];

  const mockSession = {
    user_id: 'user123',
    agency_id: mockAgencyId,
    role: 'admin' as const,
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockGetUserSession.mockResolvedValue(mockSession);
    hasPermission.mockReturnValue(true); // Default: user has permission

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('Success Cases', () => {
    it('should return engineer performance metrics successfully', async () => {
      // Mock engineer fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      // Mock jobs fetch
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.engineer_id).toBe(mockEngineerId);
      expect(data.engineer_name).toBe('John Doe');
      expect(data.performance_summary).toBeDefined();
      expect(data.performance_summary.total_jobs_completed).toBe(2);
      expect(data.performance_summary.total_jobs_cancelled).toBe(1);
      expect(data.performance_summary.success_rate).toBe(66.67);
      expect(data.rating_details).toBeDefined();
      expect(data.job_history).toBeDefined();
      expect(data.certifications).toBeDefined();
    });

    it('should calculate success rate correctly', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      // 2 completed, 1 cancelled = 2/3 = 66.67%
      expect(data.performance_summary.success_rate).toBe(66.67);
    });

    it('should calculate average rating correctly', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      // (5 + 4) / 2 = 4.5
      expect(data.rating_details.average_rating).toBe(4.5);
      expect(data.rating_details.total_ratings).toBe(2);
    });

    it('should include job history with ratings and feedback', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.job_history).toHaveLength(2); // Only completed jobs
      expect(data.job_history[0].client_rating).toBe(5);
      expect(data.job_history[0].client_feedback).toBe('Excellent service');
      expect(data.job_history[1].client_rating).toBe(4);
      expect(data.job_history[1].client_feedback).toBe('Good work');
    });

    it('should include certification details', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.certifications).toHaveLength(1);
      expect(data.certifications[0].type).toBe('PMKVY');
      expect(data.certifications[0].level).toBe(3);
      expect(data.certifications[0].verified).toBe(true);
    });

    it('should exclude job history when include_history=false', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance?include_history=false`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.job_history).toHaveLength(0);
      expect(data.performance_summary).toBeDefined(); // Summary still included
    });

    it('should filter jobs by period parameter', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance?period=week`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(200);
      
      // Verify that gte was called with a date filter
      expect(mockSupabaseClient.gte).toHaveBeenCalled();
    });

    it('should handle engineer with no jobs', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.performance_summary.total_jobs_completed).toBe(0);
      expect(data.performance_summary.success_rate).toBe(0);
      expect(data.rating_details.average_rating).toBe(0);
      expect(data.job_history).toHaveLength(0);
    });

    it('should calculate performance by job type', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.performance_by_job_type).toBeDefined();
      const amcPerformance = data.performance_by_job_type.find((p: any) => p.job_type === 'AMC');
      expect(amcPerformance).toBeDefined();
      expect(amcPerformance.total_jobs).toBe(1);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid engineer ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/engineers/invalid-id/performance'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'invalid-id' }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('INVALID_ID');
      expect(data.error.message).toBe('Invalid engineer ID format');
    });

    it('should return 400 for invalid period parameter', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance?period=invalid`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when user lacks engineer:read permission', async () => {
      mockGetUserSession.mockResolvedValueOnce({
        ...mockSession,
        role: 'viewer' as const,
      });
      
      // Mock hasPermission to return false for viewer role
      hasPermission.mockReturnValueOnce(false);

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 when accessing engineer from different agency', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...mockEngineer,
          agency_id: 'different-agency-id',
        },
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('your agency');
    });

    it('should return 404 when engineer is not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Database Errors', () => {
    it('should return 500 when job history fetch fails', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle engineer with only cancelled jobs', async () => {
      const cancelledOnlyJobs = [
        {
          ...mockCompletedJobs[2],
          id: 'job4',
          status: 'cancelled',
        },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: cancelledOnlyJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.performance_summary.total_jobs_completed).toBe(0);
      expect(data.performance_summary.total_jobs_cancelled).toBe(1);
      expect(data.performance_summary.success_rate).toBe(0);
    });

    it('should handle jobs without ratings', async () => {
      const jobsWithoutRatings = [
        {
          ...mockCompletedJobs[0],
          client_rating: null,
          client_feedback: null,
        },
      ];

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockEngineer,
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: jobsWithoutRatings,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.rating_details.average_rating).toBe(0);
      expect(data.rating_details.total_ratings).toBe(0);
    });

    it('should handle engineer with no certifications', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          ...mockEngineer,
          certifications: [],
        },
        error: null,
      });

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCompletedJobs,
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/engineers/${mockEngineerId}/performance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockEngineerId }),
      });

      const data = await response.json();
      
      expect(data.certifications).toHaveLength(0);
    });
  });
});
