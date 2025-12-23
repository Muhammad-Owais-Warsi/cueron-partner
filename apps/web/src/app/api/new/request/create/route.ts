import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validation schema
 */
const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Invalid phone number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    const validation = schema.safeParse(body);

    console.log(validation);
    console.log(body);

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

    const { data, error } = await supabase
      .from('requests')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // console.log('Request created:', data.id);

    return NextResponse.json(
      {
        engineer: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating request:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create request',
        },
      },
      { status: 500 }
    );
  }
}
