/**
 * Invoice Generation API Route
 * POST /api/payments/create-invoice - Generate invoice for a payment
 * 
 * Creates a unique invoice number, generates a PDF invoice with branding,
 * stores the invoice URL in the payment record, and optionally sends via email.
 * 
 * Requirements: 11.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import PDFDocument from 'pdfkit';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Generate unique invoice number
 * Format: INV-YYYY-NNNNNN (e.g., INV-2025-000123)
 * 
 * Property 51: Invoice uniqueness
 * Validates: Requirements 11.4
 */
async function generateInvoiceNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Get the latest invoice number for this year
  const { data: latestInvoice } = await supabase
    .from('payments')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single();
  
  let nextNumber = 1;
  
  if (latestInvoice && latestInvoice.invoice_number) {
    // Extract the number part and increment
    const numberPart = latestInvoice.invoice_number.split('-')[2];
    nextNumber = parseInt(numberPart, 10) + 1;
  }
  
  // Pad with zeros to 6 digits
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  
  return `${prefix}${paddedNumber}`;
}

/**
 * Generate PDF invoice with branding
 * Creates a professional invoice PDF with agency branding
 */
async function generateInvoicePDF(
  invoiceData: {
    invoice_number: string;
    invoice_date: string;
    agency_name: string;
    agency_address?: string;
    agency_gstn?: string;
    job_number?: string;
    amount: number;
    payment_type: string;
    due_date?: string;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    
    // Collect PDF data
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);
    
    // Header with branding
    doc
      .fontSize(24)
      .fillColor('#1a56db')
      .text('CUERON', 50, 50);
    
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('India\'s First Preventive HVAC Maintenance Network', 50, 80);
    
    // Invoice title
    doc
      .fontSize(20)
      .fillColor('#111827')
      .text('INVOICE', 400, 50, { align: 'right' });
    
    doc
      .fontSize(12)
      .fillColor('#6b7280')
      .text(invoiceData.invoice_number, 400, 75, { align: 'right' });
    
    // Line separator
    doc
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke('#e5e7eb');
    
    // Bill To section
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('BILL TO:', 50, 140);
    
    doc
      .fontSize(11)
      .fillColor('#374151')
      .text(invoiceData.agency_name, 50, 160);
    
    if (invoiceData.agency_address) {
      doc.text(invoiceData.agency_address, 50, 175, { width: 250 });
    }
    
    if (invoiceData.agency_gstn) {
      doc.text(`GSTN: ${invoiceData.agency_gstn}`, 50, 205);
    }
    
    // Invoice details
    const detailsX = 350;
    let detailsY = 140;
    
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Invoice Date:', detailsX, detailsY);
    doc
      .fillColor('#111827')
      .text(new Date(invoiceData.invoice_date).toLocaleDateString('en-IN'), detailsX + 100, detailsY);
    
    detailsY += 20;
    
    if (invoiceData.due_date) {
      doc
        .fillColor('#6b7280')
        .text('Due Date:', detailsX, detailsY);
      doc
        .fillColor('#111827')
        .text(new Date(invoiceData.due_date).toLocaleDateString('en-IN'), detailsX + 100, detailsY);
      detailsY += 20;
    }
    
    if (invoiceData.job_number) {
      doc
        .fillColor('#6b7280')
        .text('Job Number:', detailsX, detailsY);
      doc
        .fillColor('#111827')
        .text(invoiceData.job_number, detailsX + 100, detailsY);
    }
    
    // Items table
    const tableTop = 280;
    
    // Table header
    doc
      .rect(50, tableTop, 500, 30)
      .fillAndStroke('#f3f4f6', '#e5e7eb');
    
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('Description', 60, tableTop + 10)
      .text('Amount', 450, tableTop + 10);
    
    // Table row
    const rowY = tableTop + 40;
    
    const paymentDescription = invoiceData.payment_type 
      ? `${invoiceData.payment_type.replace('_', ' ').toUpperCase()} - ${invoiceData.job_number || 'Service Fee'}`
      : `Service Fee - ${invoiceData.job_number || 'Payment'}`;
    
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(
        paymentDescription,
        60,
        rowY,
        { width: 350 }
      );
    
    doc
      .text(`₹${invoiceData.amount.toFixed(2)}`, 450, rowY);
    
    // Line separator
    doc
      .moveTo(50, rowY + 30)
      .lineTo(550, rowY + 30)
      .stroke('#e5e7eb');
    
    // Total
    const totalY = rowY + 50;
    
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Total Amount:', 350, totalY);
    
    doc
      .fontSize(14)
      .fillColor('#1a56db')
      .text(`₹${invoiceData.amount.toFixed(2)}`, 450, totalY);
    
    // Footer
    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text(
        'Thank you for your business!',
        50,
        700,
        { align: 'center', width: 500 }
      );
    
    doc
      .text(
        'For any queries, please contact support@cueron.com',
        50,
        715,
        { align: 'center', width: 500 }
      );
    
    // Finalize PDF
    doc.end();
  });
}

/**
 * POST /api/payments/create-invoice
 * Generate invoice for a payment
 * 
 * Request Body:
 * - payment_id: UUID of the payment record
 * - send_email: Optional boolean to send invoice via email
 * 
 * Property 51: Invoice uniqueness
 * Validates: Requirements 11.4
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getUserSession();
    
    if (!session) {
      return errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        undefined,
        401
      );
    }

    // Check if user has permission to create invoices
    try {
      assertPermission(session.role, 'payment:write');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse(
        'INVALID_REQUEST',
        'Invalid JSON in request body',
        undefined,
        400
      );
    }
    
    const { payment_id, send_email = false } = body;

    // Validate required fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!payment_id) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required field: payment_id',
        { payment_id: ['Payment ID is required'] },
        400
      );
    }

    if (!uuidRegex.test(payment_id)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid payment ID format',
        { payment_id: ['Must be a valid UUID'] },
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch payment with agency details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        agency:agencies(
          id,
          name,
          primary_location,
          gstn
        ),
        job:jobs(
          job_number
        )
      `)
      .eq('id', payment_id)
      .single();

    if (fetchError || !payment) {
      return errorResponse(
        'NOT_FOUND',
        'Payment not found',
        undefined,
        404
      );
    }

    // Check data isolation - user can only create invoices for their agency
    if (payment.agency_id) {
      try {
        assertAgencyAccess(session.agency_id, payment.agency_id);
      } catch (error: any) {
        return errorResponse(
          'FORBIDDEN',
          error.message,
          undefined,
          403
        );
      }
    }

    // Check if invoice already exists
    if (payment.invoice_number && payment.invoice_url) {
      return successResponse({
        invoice_number: payment.invoice_number,
        invoice_url: payment.invoice_url,
        message: 'Invoice already exists for this payment',
      });
    }

    // Generate unique invoice number
    // Property 51: Invoice uniqueness
    const invoiceNumber = await generateInvoiceNumber(supabase);

    // Prepare invoice data
    const invoiceDate = new Date().toISOString();
    const invoiceData = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      agency_name: payment.agency?.name || 'Agency',
      agency_address: payment.agency?.primary_location 
        ? `${payment.agency.primary_location.city}, ${payment.agency.primary_location.state} - ${payment.agency.primary_location.pincode}`
        : undefined,
      agency_gstn: payment.agency?.gstn,
      job_number: payment.job?.job_number,
      amount: payment.amount,
      payment_type: payment.payment_type,
      due_date: payment.due_date,
    };

    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Upload PDF to Supabase Storage
    const fileName = `${invoiceNumber}.pdf`;
    const filePath = `invoices/${payment.agency_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading invoice PDF:', uploadError);
      return errorResponse(
        'UPLOAD_ERROR',
        'Failed to upload invoice PDF',
        undefined,
        500
      );
    }

    // Get public URL for the invoice
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const invoiceUrl = urlData.publicUrl;

    // Update payment record with invoice details
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        invoice_date: invoiceDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment with invoice details:', updateError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to update payment record',
        undefined,
        500
      );
    }

    // TODO: Implement email delivery if send_email is true
    // This would integrate with SendGrid or AWS SES
    if (send_email) {
      console.log(`Email delivery requested for invoice ${invoiceNumber}`);
      // await sendInvoiceEmail(payment.agency?.email, invoiceUrl, invoiceNumber);
    }

    return successResponse({
      invoice_number: invoiceNumber,
      invoice_url: invoiceUrl,
      invoice_date: invoiceDate,
      payment: updatedPayment,
      message: 'Invoice generated successfully',
    }, 201);
  } catch (error) {
    console.error('Unexpected error in POST /api/payments/create-invoice:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}
