/**
 * Tests for Agency Earnings API Route
 * Verifies demo data integration and response format
 */

import { GET } from './route';
import { getUserSession } from '@/lib/auth/server';
import { generateEarnings } from '@/lib/demo-data/generator';

// Mock dependencies
jest.mock('@/lib/auth/server');
jest.mock('@/lib/demo-data/generator');
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockGenerateEarnings = generateEarnings as jest.MockedFunction<typeof generateEarnings>;

describe('GET /api/agencies/[id]/earnings', () => {
  const mockAgencyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return demo data for demo users', async () => {
    // Arrange
    const mockSession = {
      user_id: mockUserId,
      role: 'admin' as const,
      agency_id: mockAgencyId,
      is_demo_user: true,
    };

    const mockDemoData = {
      daily: {
        earnings: 15000,
        jobs_completed: 5,
      },
      monthly: {
        earnings: 350000,
        jobs_completed: 120,
      },
      yearly: {
        earnings: 4200000,
        jobs_completed: 1500,
      },
    };

    mockGetUserSession.mockResolvedValue(mockSession);
    mockGenerateEarnings.mockReturnValue(mockDemoData);

    const mockRequest = new Request('http://localhost:3000/api/agencies/' + mockAgencyId + '/earnings');
    const mockParams = Promise.resolve({ id: mockAgencyId });

    // Act
    const response = await GET(mockRequest as any, { params: mockParams });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockGenerateEarnings).toHaveBeenCalledWith(mockUserId);
    expect(data.daily).toEqual(mockDemoData.daily);
    expect(data.monthly).toEqual(mockDemoData.monthly);
    expect(data.yearly).toEqual(mockDemoData.yearly);
    expect(data.generated_at).toBeDefined();
  });

  it('should return 401 for unauthenticated users', async () => {
    // Arrange
    mockGetUserSession.mockResolvedValue(null);

    const mockRequest = new Request('http://localhost:3000/api/agencies/' + mockAgencyId + '/earnings');
    const mockParams = Promise.resolve({ id: mockAgencyId });

    // Act
    const response = await GET(mockRequest as any, { params: mockParams });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 for invalid agency ID format', async () => {
    // Arrange
    const invalidId = 'invalid-id';
    const mockRequest = new Request('http://localhost:3000/api/agencies/' + invalidId + '/earnings');
    const mockParams = Promise.resolve({ id: invalidId });

    // Act
    const response = await GET(mockRequest as any, { params: mockParams });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ID');
  });
});
