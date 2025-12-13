/**
 * Engineer Creation API Route
 * POST /api/engineers/add
 *
 * Inserts into `public.new_engineers`
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Mirror DB enum: user_role
 */
const userRoleEnum = z.enum(['junior_engineer', 'agency_engineer', 'freelance_engineer']);

/**
 * Validation schema
 */
const newEngineerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Invalid phone number'),
  role: userRoleEnum,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const validation = newEngineerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid engineer data',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const engineer = validation.data;

    const { data: existingEngineer, error: fetchError } = await supabase
      .from('new_engineers')
      .select('id')
      .or(`phone.eq.${engineer.phone},email.eq.${engineer.email}`)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingEngineer) {
      return NextResponse.json(
        {
          error: {
            code: 'ENGINEER_EXISTS',
            message: 'Engineer with same phone or email already exists',
          },
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('new_engineers')
      .insert({
        name: engineer.name,
        email: engineer.email,
        phone: engineer.phone,
        role: engineer.role,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Engineer created:', data.id);

    return NextResponse.json(
      {
        engineer: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating engineer:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create engineer',
        },
      },
      { status: 500 }
    );
  }
}
