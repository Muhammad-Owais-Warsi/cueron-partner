/**
 * Agency Profile Management API Tests
 * Tests for GET and PATCH /api/agencies/{id}
 */

import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { encrypt, decrypt } from '@cueron/utils/src/encryption';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');
jest.mock('@cueron/utils/src/encryption');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockEncrypt = encrypt as jest.MockedFunction<typeof encrypt>;
const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;

describe('GET /api/agencies/[id]', () => {
  const mockAgencyId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockEncrypt.mockImplementation((value: string) => `encrypted_${value}`);
    mockDecrypt.mockImplementation((value: string) => value.replace('encrypted_', ''));
  });

  it('should return 400 for invalid agency ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/agencies/invalid-id');
    const params = Promise.resolve({ id: 'invalid-id' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ID');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 if user does not have agency:read permission', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'engineer', // Engineers don't have agency:read permission
      agency_id: mockAgencyId,
    });

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 403 if user tries to access another agency data', async () => {
    const differentAgencyId = '223e4567-e89b-12d3-a456-426614174000';
    
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: differentAgencyId,
    });

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 404 if agency does not exist', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should return agency details with decrypted bank information', async () => {
    const mockAgency = {
      id: mockAgencyId,
      name: 'Test Agency',
      type: 'ITI',
      gstn: '29ABCDE1234F1Z5',
      phone: '9876543210',
      email: 'test@agency.com',
      bank_account_number: 'encrypted_1234567890',
      pan_number: 'encrypted_ABCDE1234F',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAgency,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(mockAgencyId);
    expect(data.bank_account_number).toBe('1234567890');
    expect(data.pan_number).toBe('ABCDE1234F');
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted_1234567890');
    expect(mockDecrypt).toHaveBeenCalledWith('encrypted_ABCDE1234F');
  });

  it('should handle decryption errors gracefully', async () => {
    const mockAgency = {
      id: mockAgencyId,
      name: 'Test Agency',
      bank_account_number: 'corrupted_data',
      pan_number: 'corrupted_data',
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    mockDecrypt.mockImplementation(() => {
      throw new Error('Decryption failed');
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAgency,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`);
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bank_account_number).toBeUndefined();
    expect(data.pan_number).toBeUndefined();
  });
});

describe('PATCH /api/agencies/[id]', () => {
  const mockAgencyId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEncrypt.mockImplementation((value: string) => `encrypted_${value}`);
    mockDecrypt.mockImplementation((value: string) => value.replace('encrypted_', ''));
  });

  it('should return 400 for invalid agency ID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/agencies/invalid-id', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const params = Promise.resolve({ id: 'invalid-id' });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ID');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUserSession.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 if user does not have agency:write permission', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'viewer', // Viewers don't have write permission
      agency_id: mockAgencyId,
    });

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 for invalid input data', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        phone: 'invalid', // Invalid phone format
        email: 'not-an-email', // Invalid email
      }),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
  });

  it('should update agency profile successfully', async () => {
    const updateData = {
      name: 'Updated Agency Name',
      contact_person: 'New Contact',
      phone: '9876543210',
      email: 'updated@agency.com',
    };

    const updatedAgency = {
      id: mockAgencyId,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: updatedAgency,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agency.name).toBe('Updated Agency Name');
    expect(data.message).toBe('Agency profile updated successfully');
  });

  it('should encrypt bank details when updating', async () => {
    const updateData = {
      bank_account_number: '1234567890',
      pan_number: 'ABCDE1234F',
    };

    const updatedAgency = {
      id: mockAgencyId,
      bank_account_number: 'encrypted_1234567890',
      pan_number: 'encrypted_ABCDE1234F',
      updated_at: new Date().toISOString(),
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockUpdate = jest.fn().mockReturnThis();
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: mockUpdate,
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: updatedAgency,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockEncrypt).toHaveBeenCalledWith('1234567890');
    expect(mockEncrypt).toHaveBeenCalledWith('ABCDE1234F');
    expect(data.agency.bank_account_number).toBe('1234567890');
    expect(data.agency.pan_number).toBe('ABCDE1234F');
  });

  it('should update service areas', async () => {
    const updateData = {
      service_areas: ['Mumbai', 'Pune', 'Bangalore'],
    };

    const updatedAgency = {
      id: mockAgencyId,
      service_areas: ['Mumbai', 'Pune', 'Bangalore'],
      updated_at: new Date().toISOString(),
    };

    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: updatedAgency,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.agency.service_areas).toEqual(['Mumbai', 'Pune', 'Bangalore']);
  });

  it('should return 404 if agency does not exist', async () => {
    mockGetUserSession.mockResolvedValue({
      user_id: 'user-123',
      role: 'admin',
      agency_id: mockAgencyId,
    });

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const request = new NextRequest(`http://localhost:3000/api/agencies/${mockAgencyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const params = Promise.resolve({ id: mockAgencyId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});
