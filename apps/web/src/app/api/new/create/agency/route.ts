import { NextRequest, NextResponse } from 'next/server';
import { CreateAgencyInputSchema } from '@cueron/utils/src/schemas';
import { encrypt } from '@cueron/utils/src/encryption';
import { createAdminClient } from '@/lib/supabase/server';
import type { CreateAgencyInput } from '@cueron/types/src/agency';

function errorResponse(code: string, message: string, details?: any, status: number = 400) {
  return NextResponse.json(
    { error: { code, message, details, timestamp: new Date().toISOString() } },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createAdminClient();
  let createdUserId: string | null = null;

  try {
    const body = await request.json();
    const validation = CreateAgencyInputSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        validation.error.format(),
        400
      );
    }

    const agencyData: CreateAgencyInput = validation.data;

    // Check for existing agency by GSTN
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('gstn', agencyData.gstn)
      .maybeSingle();

    if (existingAgency) {
      return errorResponse('DUPLICATE_GSTN', 'Agency with this GSTN already exists', null, 409);
    }

    // 1. Create Auth User
    const { data: authRes, error: authErr } = await supabase.auth.admin.createUser({
      email: agencyData.email,
      password: '123456',
      email_confirm: true,
      user_metadata: {
        name: agencyData.contact_person,
        phone: agencyData.phone,
        role: 'manager',
      },
    });

    if (authErr || !authRes?.user) {
      console.error('Auth Error:', authErr);
      return errorResponse('AUTH_ERROR', authErr?.message || 'Auth creation failed', authErr, 500);
    }

    createdUserId = authRes.user.id;

    // 2. Insert into "users" table (Public Profile)
    const { error: userTableErr } = await supabase.from('users').insert({
      id: createdUserId,
      email: agencyData.email,
      role: 'manager',
    });

    if (userTableErr) {
      console.error('Users Table Error:', userTableErr);
      await supabase.auth.admin.deleteUser(createdUserId);
      return errorResponse('DATABASE_ERROR', 'Profile sync failed', userTableErr, 500);
    }

    // 3. Encrypt Sensitive Data
    const encryptedBankAccount = agencyData.bank_account_number
      ? encrypt(agencyData.bank_account_number)
      : undefined;
    const encryptedPAN = agencyData.pan_number ? encrypt(agencyData.pan_number) : undefined;

    // 4. Create Agency Record
    const { data: newAgency, error: agencyErr } = await supabase
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

    if (agencyErr) {
      console.error('Agency Insert Error:', agencyErr);
      // Rollback both profile and auth
      await supabase.from('users').delete().eq('id', createdUserId);
      await supabase.auth.admin.deleteUser(createdUserId);
      return errorResponse('DATABASE_ERROR', 'Agency creation failed', agencyErr, 500);
    }

    return NextResponse.json(
      {
        agency_id: newAgency.id,
        user_id: createdUserId,
        status: newAgency.status,
        message: 'Agency and Manager account created successfully.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Fatal Registration Error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error.message || 'An unexpected error occurred',
      null,
      500
    );
  }
}
