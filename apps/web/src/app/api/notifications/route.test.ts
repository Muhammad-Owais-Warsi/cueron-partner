/**
 * Notifications API Tests
 */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/notifications', () => {
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

    const request = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return notifications for authenticated user', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotifications = [
      {
        id: 'notif-1',
        user_id: 'user-123',
        title: 'Job Assigned',
        message: 'You have been assigned to job JOB-2025-1234',
        type: 'job_assigned',
        is_read: false,
        created_at: '2025-01-15T10:00:00Z',
      },
      {
        id: 'notif-2',
        user_id: 'user-123',
        title: 'Job Completed',
        message: 'Job JOB-2025-1233 has been completed',
        type: 'job_completed',
        is_read: true,
        read_at: '2025-01-15T11:00:00Z',
        created_at: '2025-01-15T09:00:00Z',
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockNotifications,
        error: null,
        count: 2,
      }),
    };

    const mockCountQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        count: 1,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'notifications') {
        return {
          select: jest.fn((columns: string, options?: any) => {
            if (options?.head) {
              return mockCountQuery;
            }
            return mockQuery;
          }),
        };
      }
      return mockQuery;
    });

    const request = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.unreadCount).toBe(1);
    expect(data.notifications[0].id).toBe('notif-1');
  });

  it('should filter notifications by unread status', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotifications = [
      {
        id: 'notif-1',
        user_id: 'user-123',
        title: 'Job Assigned',
        message: 'You have been assigned to job JOB-2025-1234',
        type: 'job_assigned',
        is_read: false,
        created_at: '2025-01-15T10:00:00Z',
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockNotifications,
        error: null,
        count: 1,
      }),
    };

    const mockCountQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        count: 1,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      return {
        select: jest.fn((columns: string, options?: any) => {
          if (options?.head) {
            return mockCountQuery;
          }
          return mockQuery;
        }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?unread_only=true'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].is_read).toBe(false);
    expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false);
  });

  it('should filter notifications by type', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotifications = [
      {
        id: 'notif-1',
        user_id: 'user-123',
        title: 'Job Assigned',
        message: 'You have been assigned to job JOB-2025-1234',
        type: 'job_assigned',
        is_read: false,
        created_at: '2025-01-15T10:00:00Z',
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockNotifications,
        error: null,
        count: 1,
      }),
    };

    const mockCountQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        count: 1,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      return {
        select: jest.fn((columns: string, options?: any) => {
          if (options?.head) {
            return mockCountQuery;
          }
          return mockQuery;
        }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?type=job_assigned'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].type).toBe('job_assigned');
    expect(mockQuery.eq).toHaveBeenCalledWith('type', 'job_assigned');
  });

  it('should handle pagination parameters', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };

    const mockCountQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        count: 0,
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      return {
        select: jest.fn((columns: string, options?: any) => {
          if (options?.head) {
            return mockCountQuery;
          }
          return mockQuery;
        }),
      };
    });

    const request = new NextRequest(
      'http://localhost:3000/api/notifications?limit=10&offset=20'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limit).toBe(10);
    expect(data.offset).toBe(20);
    expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
  });

  it('should return 500 if database query fails', async () => {
    const mockUser = { id: 'user-123' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    });

    const request = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch notifications');
  });
});
