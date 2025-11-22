/**
 * Tests for Bulk Engineer Upload API
 * POST /api/engineers/bulk-upload
 */

import { POST } from './route';
import { createAdminClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn(),
}));

describe('POST /api/engineers/bulk-upload', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Validation', () => {
    it('should return error when file is missing', async () => {
      const formData = new FormData();
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_FILE');
      expect(data.error.details.file).toContain('CSV file is required');
    });

    it('should return error when agency_id is missing', async () => {
      const csvContent = 'name,phone,skill_level,employment_type\nJohn Doe,9876543210,3,full_time';
      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_AGENCY_ID');
    });

    it('should return error for invalid file type', async () => {
      const file = new File(['test'], 'engineers.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should return error for empty CSV file', async () => {
      const file = new File([''], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('EMPTY_FILE');
    });

    it('should return error for missing required headers', async () => {
      const csvContent = 'name,email\nJohn Doe,john@example.com';
      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_HEADERS');
      expect(data.error.details.headers[0]).toContain('phone');
      expect(data.error.details.headers[0]).toContain('skill_level');
    });
  });

  describe('Successful Upload', () => {
    it('should successfully create engineers from valid CSV', async () => {
      const csvContent = `name,phone,email,skill_level,employment_type,specializations
Rajesh Kumar,9876543210,rajesh@example.com,3,full_time,Cold Storage|HVAC
Priya Sharma,9876543211,priya@example.com,4,full_time,Refrigeration`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      // Mock existing engineers check (no duplicates)
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock successful inserts
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: '1', name: 'Rajesh Kumar', phone: '9876543210' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: '2', name: 'Priya Sharma', phone: '9876543211' },
          error: null,
        });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(2);
      expect(data.error_count).toBe(0);
      expect(data.errors).toHaveLength(0);
    });

    it('should handle CSV with optional fields', async () => {
      const csvContent = `name,phone,skill_level,employment_type
John Doe,9876543210,2,part_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', name: 'John Doe', phone: '9876543210' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(data.error_count).toBe(0);
    });

    it('should parse certifications correctly', async () => {
      const csvContent = `name,phone,skill_level,employment_type,certifications
Amit Patel,9876543210,3,full_time,PMKVY:2:CERT123:true|ITI:3:CERT456:false`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      let insertedData: any;
      mockSupabase.insert.mockImplementation((data: any) => {
        insertedData = data;
        return mockSupabase;
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', name: 'Amit Patel' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(insertedData.certifications).toHaveLength(2);
      expect(insertedData.certifications[0]).toEqual({
        type: 'PMKVY',
        level: 2,
        cert_number: 'CERT123',
        verified: true,
      });
    });
  });

  describe('Error Handling', () => {
    it('should report validation errors for invalid rows', async () => {
      const csvContent = `name,phone,skill_level,employment_type
Rajesh Kumar,123,3,full_time
Priya Sharma,9876543211,10,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(0);
      expect(data.error_count).toBeGreaterThan(0);
      expect(data.errors.some((e: any) => e.field === 'phone')).toBe(true);
    });

    it('should detect duplicate phone numbers in database', async () => {
      const csvContent = `name,phone,skill_level,employment_type
Rajesh Kumar,9876543210,3,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      // Mock existing engineer with same phone
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ phone: '9876543210' }],
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(0);
      expect(data.error_count).toBe(1);
      expect(data.errors[0].field).toBe('phone');
      expect(data.errors[0].message).toContain('already exists');
    });

    it('should detect duplicate phone numbers within CSV', async () => {
      const csvContent = `name,phone,skill_level,employment_type
Rajesh Kumar,9876543210,3,full_time
Priya Sharma,9876543210,4,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: '1', name: 'Rajesh Kumar' },
          error: null,
        });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(data.error_count).toBe(1);
      expect(data.errors[0].row).toBe(3);
      expect(data.errors[0].message).toContain('already exists');
    });

    it('should continue processing after database errors', async () => {
      const csvContent = `name,phone,skill_level,employment_type
Rajesh Kumar,9876543210,3,full_time
Priya Sharma,9876543211,4,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // First insert fails, second succeeds
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        })
        .mockResolvedValueOnce({
          data: { id: '2', name: 'Priya Sharma' },
          error: null,
        });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(data.error_count).toBe(1);
      expect(data.errors[0].field).toBe('database');
    });
  });

  describe('CSV Parsing', () => {
    it('should handle quoted fields with commas', async () => {
      const csvContent = `name,phone,skill_level,employment_type
"Kumar, Rajesh",9876543210,3,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      let insertedData: any;
      mockSupabase.insert.mockImplementation((data: any) => {
        insertedData = data;
        return mockSupabase;
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(insertedData.name).toBe('Kumar, Rajesh');
    });

    it('should handle empty optional fields', async () => {
      const csvContent = `name,phone,email,skill_level,employment_type
Rajesh Kumar,9876543210,,3,full_time`;

      const file = new File([csvContent], 'engineers.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      let insertedData: any;
      mockSupabase.insert.mockImplementation((data: any) => {
        insertedData = data;
        return mockSupabase;
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1' },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/engineers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success_count).toBe(1);
      expect(insertedData.email).toBeUndefined();
    });
  });
});
