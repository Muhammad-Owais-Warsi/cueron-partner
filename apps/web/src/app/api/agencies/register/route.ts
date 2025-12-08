/**
 * Agency Registration API Route
 * POST /api/agencies/register
 *
 * Handles new agency registration with validation, GSTN uniqueness check,
 * bank detail encryption, and SMS notification.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateAgencyInputSchema } from '@cueron/utils/src/schemas';
import { encrypt } from '@cueron/utils/src/encryption';
import { createAdminClient } from '@/lib/supabase/server';
import type { CreateAgencyInput } from '@cueron/types/src/agency';

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
 * POST /api/agencies/register
 * Register a new agency
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data with Zod
    const validation = CreateAgencyInputSchema.safeParse(body);
    console.log(validation.error);

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.errors.forEach((err: any) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return errorResponse('VALIDATION_ERROR', 'Invalid input data', fieldErrors, 400);
    }

    const agencyData: CreateAgencyInput = validation.data;

    // Create Supabase admin client (bypasses RLS for registration)
    const supabase = createAdminClient();

    // Check GSTN uniqueness
    const { data: existingAgency, error: checkError } = await supabase
      .from('agencies')
      .select('id, gstn')
      .eq('gstn', agencyData.gstn)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking GSTN uniqueness:', checkError);
      return errorResponse('DATABASE_ERROR', 'Failed to validate GSTN uniqueness', undefined, 500);
    }

    if (existingAgency) {
      return errorResponse(
        'DUPLICATE_GSTN',
        'An agency with this GSTN is already registered',
        { gstn: ['GSTN already exists'] },
        409
      );
    }

    // Encrypt sensitive bank details if provided
    let encryptedBankAccount: string | undefined;
    let encryptedPAN: string | undefined;

    try {
      if (agencyData.bank_account_number) {
        encryptedBankAccount = encrypt(agencyData.bank_account_number);
      }
      if (agencyData.pan_number) {
        encryptedPAN = encrypt(agencyData.pan_number);
      }
    } catch (encryptError) {
      console.error('Encryption error:', encryptError);
      return errorResponse('ENCRYPTION_ERROR', 'Failed to encrypt sensitive data', undefined, 500);
    }

    // Create agency record with pending_approval status
    const { data: newAgency, error: insertError } = await supabase
      .from('agencies')
      .insert({
        name: agencyData.name,
        type: agencyData.type,
        registration_number: agencyData.registration_number,
        gstn: agencyData.gstn,
        nsdc_code: agencyData.nsdc_code,
        contact_person: agencyData.contact_person,
        phone: agencyData.phone,
        email: agencyData.email,
        primary_location: agencyData.primary_location,
        service_areas: agencyData.service_areas,
        partnership_tier: agencyData.partnership_tier,
        partnership_model: agencyData.partnership_model,
        engineer_capacity: agencyData.engineer_capacity,
        bank_account_name: agencyData.bank_account_name,
        bank_account_number: encryptedBankAccount,
        bank_ifsc: agencyData.bank_ifsc,
        pan_number: encryptedPAN,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating agency:', insertError);
      return errorResponse('DATABASE_ERROR', 'Failed to create agency record', undefined, 500);
    }

    // Send SMS notification
    // Note: SMS sending will be implemented when third-party integrations are set up (Task 3)
    // For now, we'll log the notification
    try {
      await sendRegistrationSMS(agencyData.phone, newAgency.id);
    } catch (smsError) {
      // Log error but don't fail the registration
      console.error('Failed to send SMS notification:', smsError);
      // Continue with successful response
    }

    // Return success response with agency_id and status
    return successResponse(
      {
        agency_id: newAgency.id,
        status: newAgency.status,
        message: 'Agency registration submitted successfully. Awaiting approval.',
      },
      201
    );
  } catch (error) {
    console.error('Unexpected error in agency registration:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', undefined, 500);
  }
}

/**
 * Send registration confirmation SMS
 * This is a placeholder that will be implemented when SMS service is configured
 */
async function sendRegistrationSMS(phone: string, agencyId: string): Promise<void> {
  // TODO: Implement SMS sending using Twilio/MSG91 when Task 3 is complete
  // For now, just log the notification
  console.log(`[SMS] Registration confirmation sent to ${phone} for agency ${agencyId}`);

  // Simulate SMS sending
  // In production, this would call Twilio/MSG91 API:
  // const message = `Thank you for registering with Cueron! Your application is under review. Agency ID: ${agencyId}`;
  // await twilioClient.messages.create({ to: phone, body: message, from: TWILIO_NUMBER });
}
