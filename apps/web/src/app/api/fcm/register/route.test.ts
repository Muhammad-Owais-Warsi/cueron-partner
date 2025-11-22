/**
 * FCM Token Registration API Tests
 * Tests for device token registration endpoint
 * 
 * Requirement 14.1: FCM token registration endpoint
 */

import { POST, DELETE } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/fcm/register', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should register new FCM token', async () => {
    const mockUser = { id: 'user-123' };
    const mockToken = {
      id: 'token-id',
      user_id: 'user-123',
      token: 'fcm_token_abc',
      device_type: 'ios',
      is_active: true,
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockToken, error: null }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'POST',
      body: JSON.stringify({
        token: 'fcm_token_abc',
        device_type: 'ios',
        device_id: 'device-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toEqual(mockToken);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      token: 'fcm_token_abc',
      device_type: 'ios',
      device_id: 'device-123',
      is_active: true,
    });
  });

  it('should update existing token for same user', async () => {
    const mockUser = { id: 'user-123' };
    const existingToken = {
      id: 'token-id',
      user_id: 'user-123',
    };
    const updatedToken = {
      ...existingToken,
      device_type: 'android',
      is_active: true,
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: existingToken, error: null }),
      }),
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: updatedToken, error: null }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'POST',
      body: JSON.stringify({
        token: 'fcm_token_abc',
        device_type: 'android',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Token updated successfully');
  });

  it('should return 401 for unauthenticated request', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'POST',
      body: JSON.stringify({
        token: 'fcm_token_abc',
        device_type: 'ios',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid device type', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'POST',
      body: JSON.stringify({
        token: 'fcm_token_abc',
        device_type: 'windows', // Invalid
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.device_type).toBeDefined();
  });

  it('should return 400 for missing token', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'POST',
      body: JSON.stringify({
        device_type: 'ios',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details.token).toBeDefined();
  });
});

describe('DELETE /api/fcm/register', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should deactivate FCM token', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost/api/fcm/register?token=fcm_token_abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Token deactivated successfully');
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
  });

  it('should accept token from request body', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'DELETE',
      body: JSON.stringify({ token: 'fcm_token_abc' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 401 for unauthenticated request', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new Request('http://localhost/api/fcm/register?token=fcm_token_abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when token is missing', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new Request('http://localhost/api/fcm/register', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });
});
