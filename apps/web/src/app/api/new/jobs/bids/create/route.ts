import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';

const bidSchema = z.object({
  job_id: z.string().uuid(),

  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),

  price: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession();

    const body = await req.json();
    const supabase = createClient();

    const parsed = bidSchema.safeParse(body);
    console.log(parsed.error);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { job_id, name, email, phone, price } = parsed.data;

    console.log(parsed.data);
    console.log('USER', user);

    const { data, error } = await supabase
      .from('bids')
      .insert({
        job_id,
        user_id: user?.user_id,
        name,
        email,
        phone,
        price,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert bid error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bid: data }, { status: 201 });
  } catch (err) {
    console.error('Apply job error:', err);
    return NextResponse.json({ error: 'Failed to apply for job' }, { status: 500 });
  }
}
