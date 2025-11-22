/**
 * Agency Registration API Tests
 * Tests for POST /api/agencies/register endpoint
 */

import { POST } from './route';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { encrypt } from '@cueron/utils/src/encryption';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@cueron/utils/src/encryption');

describe('POST /api/agencies/register', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);
    (encrypt as jest.Mock).mockImplementation((value: string) => `encrypted_${value}`);
  });

  const validAgencyData = {
    name: 'Test ITI Center',
    type: 'ITI' as const,
    registration_number: 'REG123456',
    gstn: '29ABCDE1234F1Z5',
    nsdc_code: 'NSDC123',
    contact_person: 'John Doe',
    phone: '9876543210',
    email: 'john@testiti.com',
    primary_location: {
      address: '123 Main St',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      lat: 12.9716,
      lng: 77.5946,
    },
    service_areas: ['Bangalore', 'Mysore'],
    partnership_tier: 'standard' as const,
    partnership_model: 'job_placement' as const,
    engineer_capacity: 50,
    bank_account_name: 'Test ITI Center',
    bank_account_number: '1234567890',
    bank_ifsc: 'SBIN0001234',
    pan_number: 'ABCDE1234F',
  };

  it('should successfully register a new agency with pending_approval status', async () => {
    // Mock GSTN uniqueness check - no existing agency
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock successful agency creation
    const mockAgency = {
      id: 'agency-123',
      ...validAgencyData,
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockAgency,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.agency_id).toBe('agency-123');
    expect(data.status).toBe('pending_approval');
    expect(data.message).toContain('registration submitted successfully');
  });

  it('should reject registration with duplicate GSTN', async () => {
    // Mock GSTN uniqueness check - existing agency found
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: 'existing-agency', gstn: validAgencyData.gstn },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error.code).toBe('DUPLICATE_GSTN');
    expect(data.error.message).toContain('GSTN is already registered');
  });

  it('should validate required fields', async () => {
    const invalidData = {
      name: 'Te', // Too short
      type: 'ITI',
      // Missing required fields
    };

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
  });

  it('should validate GSTN format', async () => {
    const invalidGSTN = {
      ...validAgencyData,
      gstn: 'INVALID_GSTN',
    };

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(invalidGSTN),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details?.gstn).toBeDefined();
  });

  it('should validate phone number format', async () => {
    const invalidPhone = {
      ...validAgencyData,
      phone: '123', // Invalid format
    };

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(invalidPhone),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details?.phone).toBeDefined();
  });

  it('should encrypt bank account number before storage', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const mockAgency = {
      id: 'agency-123',
      ...validAgencyData,
      bank_account_number: 'encrypted_1234567890',
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockAgency,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    await POST(request);

    // Verify encrypt was called with bank account number
    expect(encrypt).toHaveBeenCalledWith(validAgencyData.bank_account_number);
  });

  it('should encrypt PAN number before storage', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const mockAgency = {
      id: 'agency-123',
      ...validAgencyData,
      pan_number: 'encrypted_ABCDE1234F',
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockAgency,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    await POST(request);

    // Verify encrypt was called with PAN number
    expect(encrypt).toHaveBeenCalledWith(validAgencyData.pan_number);
  });

  it('should store NSDC code when provided', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const mockAgency = {
      id: 'agency-123',
      ...validAgencyData,
      nsdc_code: 'NSDC123',
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockAgency,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nsdc_code: 'NSDC123',
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should handle encryption errors gracefully', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    (encrypt as jest.Mock).mockImplementation(() => {
      throw new Error('Encryption failed');
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(validAgencyData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('ENCRYPTION_ERROR');
  });

  it('should work without optional bank details', async () => {
    const dataWithoutBankDetails = {
      ...validAgencyData,
      bank_account_name: undefined,
      bank_account_number: undefined,
      bank_ifsc: undefined,
      pan_number: undefined,
    };

    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const mockAgency = {
      id: 'agency-123',
      ...dataWithoutBankDetails,
      status: 'pending_approval',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockAgency,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/agencies/register', {
      method: 'POST',
      body: JSON.stringify(dataWithoutBankDetails),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(encrypt).not.toHaveBeenCalled();
  });
});
