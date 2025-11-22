import { POST, GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/jobs/[id]/photos', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      storage: {
        from: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  const createMockFile = (
    name: string,
    type: string,
    size: number
  ): File => {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], name, { type });
  };

  const createFormData = (file: File, photoType: string): FormData => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('photo_type', photoType);
    return formData;
  };

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
    });

    it('should return 400 if no file is provided', async () => {
      const formData = new FormData();
      formData.append('photo_type', 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('No file provided');
    });

    it('should return 400 for invalid file type', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should return 400 for file exceeding size limit', async () => {
      const file = createMockFile(
        'large.jpg',
        'image/jpeg',
        11 * 1024 * 1024
      ); // 11MB
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should accept valid JPEG file', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      // Mock job exists
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
                assigned_agency_id: 'agency-1',
                status: 'onsite',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock engineer access
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'eng-1', agency_id: 'agency-1' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock storage upload
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'job-1/before_123.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/photo.jpg' },
        }),
      });

      // Mock job update
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_before: [] },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });

      expect(response.status).toBe(201);
    });

    it('should accept PNG file', async () => {
      const file = createMockFile('test.png', 'image/png', 1024);
      const formData = createFormData(file, 'after');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      // Setup mocks similar to JPEG test
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
                status: 'onsite',
              },
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      expect(response.status).not.toBe(400);
    });

    it('should accept WebP file', async () => {
      const file = createMockFile('test.webp', 'image/webp', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
                status: 'onsite',
              },
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      expect(response.status).not.toBe(400);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
    });

    it('should return 404 if job does not exist', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('JOB_NOT_FOUND');
    });

    it('should return 403 if user does not have access to job', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      // Mock job exists
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-2',
                assigned_agency_id: 'agency-2',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock engineer check - not the assigned engineer
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'eng-1', agency_id: 'agency-1' },
              error: null,
            }),
          }),
        }),
      });

      // Mock agency user check - not from assigned agency
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { agency_id: 'agency-1' },
              error: null,
            }),
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should allow assigned engineer to upload photos', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      // Mock job
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
                assigned_agency_id: 'agency-1',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock engineer - is assigned
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'eng-1', agency_id: 'agency-1' },
              error: null,
            }),
          }),
        }),
      });

      // Mock agency user check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock storage
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'job-1/before_123.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/photo.jpg' },
        }),
      });

      // Mock job update
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_before: [] },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });

      expect(response.status).toBe(201);
    });
  });

  describe('Photo Upload', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      // Mock job and access
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
                assigned_agency_id: 'agency-1',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'eng-1', agency_id: 'agency-1' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should upload before photo and update job record', async () => {
      const file = createMockFile('before.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const mockPublicUrl = 'https://example.com/job-1/before_123.jpg';

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'job-1/before_123.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
      });

      // Mock getting current photos
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_before: [] },
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.photo_url).toBe(mockPublicUrl);
      expect(data.photo_type).toBe('before');
    });

    it('should upload after photo and update job record', async () => {
      const file = createMockFile('after.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'after');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const mockPublicUrl = 'https://example.com/job-1/after_123.jpg';

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'job-1/after_123.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_after: [] },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.photo_type).toBe('after');
    });

    it('should append to existing photos array', async () => {
      const file = createMockFile('before2.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const existingPhoto = 'https://example.com/job-1/before_111.jpg';
      const newPhoto = 'https://example.com/job-1/before_222.jpg';

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'job-1/before_222.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: newPhoto },
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_before: [existingPhoto] },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });

      expect(response.status).toBe(201);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          photos_before: [existingPhoto, newPhoto],
        })
      );
    });
  });

  describe('Upload Retry Mechanism', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'job-1',
                assigned_engineer_id: 'eng-1',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'eng-1' },
              error: null,
            }),
          }),
        }),
      });
    });

    it('should retry upload on failure', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      const mockUpload = jest
        .fn()
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Network error'),
        })
        .mockResolvedValueOnce({
          data: { path: 'job-1/before_123.jpg' },
          error: null,
        });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/photo.jpg' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { photos_before: [] },
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });

      expect(response.status).toBe(201);
      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    it('should return error after max retries', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024);
      const formData = createFormData(file, 'before');

      mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
        method: 'POST',
        body: formData,
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Network error'),
        }),
      });

      const response = await POST(mockRequest, { params: { id: 'job-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('UPLOAD_FAILED');
      expect(data.error.retry_available).toBe(true);
    });
  });
});

describe('GET /api/jobs/[id]/photos', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    mockRequest = new NextRequest('http://localhost/api/jobs/job-1/photos', {
      method: 'GET',
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await GET(mockRequest, { params: { id: 'job-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 404 if job not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const response = await GET(mockRequest, { params: { id: 'job-1' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('JOB_NOT_FOUND');
  });

  it('should return photos for authorized user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockPhotos = {
      photos_before: ['https://example.com/before1.jpg'],
      photos_after: ['https://example.com/after1.jpg'],
    };

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'job-1',
              assigned_engineer_id: 'eng-1',
              ...mockPhotos,
            },
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'eng-1' },
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(mockRequest, { params: { id: 'job-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.job_id).toBe('job-1');
    expect(data.photos_before).toEqual(mockPhotos.photos_before);
    expect(data.photos_after).toEqual(mockPhotos.photos_after);
  });

  it('should return empty arrays if no photos exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'job-1',
              assigned_engineer_id: 'eng-1',
              photos_before: null,
              photos_after: null,
            },
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'eng-1' },
            error: null,
          }),
        }),
      }),
    });

    const response = await GET(mockRequest, { params: { id: 'job-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos_before).toEqual([]);
    expect(data.photos_after).toEqual([]);
  });
});
