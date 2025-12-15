import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Zod schema matching `public.new_jobs`
 */
const jobSchema = z.object({
  location: z.string(),
  photos: z.array(z.string()).nullable().optional(),

  price: z.number(),

  equipment_type: z.string(),
  equipment_sl_no: z.string(),

  poc_name: z.string(),
  poc_phone: z.string(),
  poc_email: z.string().email(),

  problem_statement: z.string(),
  possible_solution: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const parsed = jobSchema.safeParse(body);
    console.log(parsed.error);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const j = parsed.data;

    const { data, error } = await supabase
      .from('new_jobs')
      .insert({
        location: j.location,
        photos: j.photos ?? null,
        price: j.price,

        equipment_type: j.equipment_type,
        equipment_sl_no: j.equipment_sl_no,

        poc_name: j.poc_name,
        poc_phone: j.poc_phone,
        poc_email: j.poc_email,

        problem_statement: j.problem_statement,
        possible_solution: j.possible_solution,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ job: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
