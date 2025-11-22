/**
 * Invoice Generation API Tests
 * Tests for POST /api/payments/create-invoice
 */

import { POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;

describe('POST /api/payments/create-invoice', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'test-uuid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user lacks payment:write permission', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'viewer',
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'test-uuid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if user tries to access another agency payment', async () => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });

      const paymentId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: paymentId,
          agency_id: 'agency-2', // Different agency
          amount: 5000,
          payment_type: 'job_payment',
          agency: {
            id: 'agency-2',
            name: 'Other Agency',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });
    });

    it('should return 400 if payment_id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.payment_id).toBeDefined();
    });

    it('should return 400 if payment_id is not a valid UUID', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: 'invalid-uuid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.payment_id).toContain('Must be a valid UUID');
    });

    it('should return 400 if request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Payment Retrieval', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });
    });

    it('should return 404 if payment is not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: '123e4567-e89b-12d3-a456-426614174000' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Invoice Generation', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });
    });

    it('should generate unique invoice number in correct format', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';
      const year = new Date().getFullYear();

      // Mock latest invoice query
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            invoice_number: `INV-${year}-000099`,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
              gstn: '29XXXXX1234X1Z5',
              primary_location: {
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
              },
            },
            job: {
              job_number: 'JOB-2025-1234',
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            invoice_number: `INV-${year}-000100`,
            invoice_url: 'https://storage.example.com/invoice.pdf',
          },
          error: null,
        });

      // Mock storage upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'invoices/agency-1/INV-2025-000100.pdf' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/invoice.pdf' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice_number).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(data.invoice_number).toBe(`INV-${year}-000100`);
    });

    it('should return existing invoice if already generated', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';
      const existingInvoiceNumber = 'INV-2025-000050';
      const existingInvoiceUrl = 'https://storage.example.com/existing-invoice.pdf';

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: paymentId,
          agency_id: 'agency-1',
          amount: 5000,
          payment_type: 'job_payment',
          invoice_number: existingInvoiceNumber,
          invoice_url: existingInvoiceUrl,
          agency: {
            id: 'agency-1',
            name: 'Test Agency',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoice_number).toBe(existingInvoiceNumber);
      expect(data.invoice_url).toBe(existingInvoiceUrl);
      expect(data.message).toContain('already exists');
    });

    it('should generate PDF invoice with agency branding', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No previous invoice' },
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
              gstn: '29XXXXX1234X1Z5',
              primary_location: {
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
              },
            },
            job: {
              job_number: 'JOB-2025-1234',
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            invoice_number: 'INV-2025-000001',
            invoice_url: 'https://storage.example.com/invoice.pdf',
          },
          error: null,
        });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'invoices/agency-1/INV-2025-000001.pdf' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/invoice.pdf' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('documents');
      expect(mockSupabase.storage.from().upload).toHaveBeenCalled();
      
      // Verify upload was called with PDF buffer
      const uploadCall = mockSupabase.storage.from().upload.mock.calls[0];
      expect(uploadCall[0]).toMatch(/^invoices\/agency-1\/INV-\d{4}-\d{6}\.pdf$/);
      expect(uploadCall[1]).toBeInstanceOf(Buffer);
      expect(uploadCall[2]).toEqual({
        contentType: 'application/pdf',
        upsert: false,
      });
    });

    it('should store invoice URL in payment record', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';
      const invoiceUrl = 'https://storage.example.com/invoice.pdf';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No previous invoice' },
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            invoice_number: 'INV-2025-000001',
            invoice_url: invoiceUrl,
          },
          error: null,
        });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'invoices/agency-1/INV-2025-000001.pdf' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: invoiceUrl },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice_url).toBe(invoiceUrl);
      expect(mockSupabase.update).toHaveBeenCalled();
      
      // Verify update was called with correct data
      const updateCall = mockSupabase.update.mock.calls[0][0];
      expect(updateCall.invoice_number).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(updateCall.invoice_url).toBe(invoiceUrl);
      expect(updateCall.invoice_date).toBeDefined();
    });

    it('should handle storage upload errors gracefully', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No previous invoice' },
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
            },
          },
          error: null,
        });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('UPLOAD_ERROR');
    });

    it('should handle database update errors gracefully', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No previous invoice' },
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Update failed' },
        });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'invoices/agency-1/INV-2025-000001.pdf' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/invoice.pdf' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Invoice Number Sequencing', () => {
    beforeEach(() => {
      mockGetUserSession.mockResolvedValue({
        user_id: 'user-1',
        agency_id: 'agency-1',
        role: 'admin',
      });
    });

    it('should start from 000001 if no previous invoices exist', async () => {
      const paymentId = '123e4567-e89b-12d3-a456-426614174000';
      const year = new Date().getFullYear();

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'No previous invoice' },
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            agency_id: 'agency-1',
            amount: 5000,
            payment_type: 'job_payment',
            agency: {
              id: 'agency-1',
              name: 'Test Agency',
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: paymentId,
            invoice_number: `INV-${year}-000001`,
            invoice_url: 'https://storage.example.com/invoice.pdf',
          },
          error: null,
        });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'invoices/agency-1/INV-2025-000001.pdf' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/invoice.pdf' },
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice_number).toBe(`INV-${year}-000001`);
    });
  });
});
