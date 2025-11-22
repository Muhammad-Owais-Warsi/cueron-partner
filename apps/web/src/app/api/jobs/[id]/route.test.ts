/**
 * Tests for Job Detail and Distance Calculation API
 * GET /api/jobs/{id}
 */

import { GET } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');
jest.mock('crypto', () => ({
  randomUUID: () => 'test-request-id',
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('GET /api/jobs/[id]', () => {
  let mockSupabase: any;
  let mockJobQuery: any;
  let mockEngineerQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock queries for jobs and engineers
    mockJobQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    
    mockEngineerQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn(),
    };
    
    // Setup Supabase mock that returns different queries based on table
    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'jobs') return mockJobQuery;
        if (table === 'engineers') return mockEngineerQuery;
        return mockJobQuery;
      }),
    };
    
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user does not have job:read permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'invalid_role' as any,
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if agency user tries to access job from different agency', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-2', // Different agency
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      mockJobQuery.single.mockResolvedValue({ data: mockJob, error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('do not have access');
    });

    it('should return 403 if engineer tries to access job not assigned to them', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'engineer-1',
        agency_id: 'agency-1',
        role: 'engineer',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_engineer_id: 'engineer-2', // Different engineer
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      mockJobQuery.single.mockResolvedValue({ data: mockJob, error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid UUID format', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/invalid-uuid');
      const params = Promise.resolve({ id: 'invalid-uuid' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ID');
    });
  });

  describe('Job Retrieval', () => {
    it('should return 404 if job does not exist', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      mockJobQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 500 for database errors', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      mockJobQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Job Detail Completeness (Property 12)', () => {
    it('should validate complete job details', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const completeJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'ABC Cold Storage',
        client_phone: '9876543210',
        site_location: {
          address: '123 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          lat: 19.0760,
          lng: 72.8777,
        },
        equipment_type: 'Industrial Chiller',
        required_skill_level: 3,
        job_type: 'AMC',
        urgency: 'normal',
        status: 'assigned',
      };

      mockJobQuery.single.mockResolvedValue({ data: completeJob, error: null });
      mockEngineerQuery.select.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completeness.is_complete).toBe(true);
      expect(data.completeness.missing_fields).toHaveLength(0);
      expect(data.job.client_name).toBe('ABC Cold Storage');
      expect(data.job.site_location).toBeDefined();
      expect(data.job.equipment_type).toBe('Industrial Chiller');
      expect(data.job.required_skill_level).toBe(3);
    });

    it('should identify missing required fields', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const incompleteJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        // Missing client_name
        site_location: {
          address: '123 Industrial Area',
          // Missing lat/lng
        },
        // Missing equipment_type
        required_skill_level: 3,
      };

      mockJobQuery.single.mockResolvedValue({ data: incompleteJob, error: null });
      mockEngineerQuery.select.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completeness.is_complete).toBe(false);
      expect(data.completeness.missing_fields).toContain('client_name');
      expect(data.completeness.missing_fields).toContain('equipment_type');
      expect(data.completeness.missing_fields).toContain('site_location.coordinates');
    });
  });

  describe('Skill Requirement Highlighting (Property 14)', () => {
    it('should include skill requirement highlighting in response', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 4,
      };

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.job.skill_requirement_highlighted).toBe(true);
      expect(data.job.skill_requirement).toBeDefined();
      expect(data.job.skill_requirement.level).toBe(4);
      expect(data.job.skill_requirement.description).toContain('Senior');
    });

    it('should provide descriptions for all skill levels', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const skillLevels = [1, 2, 3, 4, 5];
      const expectedDescriptions = [
        'Entry Level',
        'Junior',
        'Intermediate',
        'Senior',
        'Expert',
      ];

      for (let i = 0; i < skillLevels.length; i++) {
        const mockJob = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          job_number: 'JOB-2025-1234',
          assigned_agency_id: 'agency-1',
          client_name: 'Test Client',
          site_location: { lat: 19.0760, lng: 72.8777 },
          equipment_type: 'Chiller',
          required_skill_level: skillLevels[i],
        };

        mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
        mockSupabase.eq.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [], error: null });

        const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
        const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

        const response = await GET(request, { params });
        const data = await response.json();

        expect(data.job.skill_requirement.description).toContain(expectedDescriptions[i]);
      }
    });
  });

  describe('Distance Calculation (Property 15)', () => {
    it('should calculate distances from available engineers', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      const mockEngineers = [
        {
          id: 'engineer-1',
          current_location: { coordinates: [72.8777, 19.0760] }, // Same location
          availability_status: 'available',
        },
        {
          id: 'engineer-2',
          current_location: { coordinates: [72.9, 19.1] }, // ~3km away
          availability_status: 'available',
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({ data: mockEngineers, error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.engineer_distances).toBeDefined();
      expect(data.engineer_distances.length).toBe(2);
      
      // First engineer should be closest (distance ~0)
      expect(data.engineer_distances[0].engineer_id).toBe('engineer-1');
      expect(data.engineer_distances[0].distance_km).toBeLessThan(1);
      
      // Second engineer should be further
      expect(data.engineer_distances[1].engineer_id).toBe('engineer-2');
      expect(data.engineer_distances[1].distance_km).toBeGreaterThan(1);
      
      // Distances should be sorted (closest first)
      expect(data.engineer_distances[0].distance_km).toBeLessThan(
        data.engineer_distances[1].distance_km
      );
    });

    it('should only include available engineers in distance calculation', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      const mockEngineers = [
        {
          id: 'engineer-1',
          current_location: { coordinates: [72.8777, 19.0760] },
          availability_status: 'available',
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({ data: mockEngineers, error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.engineer_distances.length).toBe(1);
      expect(data.metadata.available_engineers_count).toBe(1);
    });

    it('should handle jobs with no available engineers', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.engineer_distances).toEqual([]);
      expect(data.metadata.available_engineers_count).toBe(0);
    });

    it('should skip distance calculation if job has no location', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: {}, // No coordinates
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.engineer_distances).toEqual([]);
    });
  });

  describe('Response Metadata', () => {
    it('should include distance calculation method in metadata', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const mockJob = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        job_number: 'JOB-2025-1234',
        assigned_agency_id: 'agency-1',
        client_name: 'Test Client',
        site_location: { lat: 19.0760, lng: 72.8777 },
        equipment_type: 'Chiller',
        required_skill_level: 3,
      };

      mockSupabase.single.mockResolvedValue({ data: mockJob, error: null });
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const request = new NextRequest('http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.distance_calculation_method).toBeDefined();
      expect(['google_maps_distance_matrix', 'haversine_formula']).toContain(
        data.metadata.distance_calculation_method
      );
    });
  });
});
