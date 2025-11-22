/**
 * Mark Notification as Read API Tests
 */

import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('PATCH /api/notifications/[id]/read', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications/notif-123/read'
    );
    const response = await PATCH(request, { params: { id: 'notif-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if notification does not exist', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications/notif-123/read'
    );
    const response = await PATCH(request, { params: { id: 'notif-123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Notification not found');
  });

  it('should return 403 if notification belongs to another user', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotification = {
      id: 'notif-123',
      user_id: 'user-456', // Different user
      is_read: false,
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockNotification,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications/notif-123/read'
    );
    const response = await PATCH(request, { params: { id: 'notif-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should mark notification as read successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotification = {
      id: 'notif-123',
      user_id: 'user-123',
      is_read: false,
    };

    const mockUpdatedNotification = {
      ...mockNotification,
      is_read: true,
      read_at: '2025-01-15T12:00:00Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockSelectQuery = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockNotification,
        error: null,
      }),
    };

    const mockUpdateQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockUpdatedNotification,
        error: null,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      return {
        select: jest.fn().mockReturnValue(mockSelectQuery),
        update: jest.fn().mockReturnValue(mockUpdateQuery),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications/notif-123/read'
    );
    const response = await PATCH(request, { params: { id: 'notif-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notification.is_read).toBe(true);
    expect(data.notification.read_at).toBeDefined();
  });

  it('should return 500 if update fails', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotification = {
      id: 'notif-123',
      user_id: 'user-123',
      is_read: false,
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockSelectQuery = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockNotification,
        error: null,
      }),
    };

    const mockUpdateQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      return {
        select: jest.fn().mockReturnValue(mockSelectQuery),
        update: jest.fn().mockReturnValue(mockUpdateQuery),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications/notif-123/read'
    );
    const response = await PATCH(request, { params: { id: 'notif-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update notification');
  });
});
