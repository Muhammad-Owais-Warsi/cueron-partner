import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inspectionSchema = z.object({
  company_name: z.string(),
  company_phone: z.string(),
  company_email: z.string().email(),

  brand_name: z.string(),
  years_of_operation_in_equipment: z.number().optional(),
  years_of_operations: z.number().optional(),

  location: z.string(),

  inspection_date: z.string(), // YYYY-MM-DD
  inspection_time: z.string(), // HH:mm

  photos: z.array(z.string()).optional(),

  gst: z.string(),
  billing_address: z.string(),

  equipment_type: z.string(),
  equipment_sl_no: z.string(),
  capacity: z.number().optional(),

  specification_plate_photo: z.string().optional(),

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

    const parsed = inspectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const i = parsed.data;

    // Combine date + time into timestamp
    const inspectionDateTime = `${i.inspection_date}T${i.inspection_time}:00`;

    const { data, error } = await supabase
      .from('inspection')
      .insert({
        company_name: i.company_name,
        company_phone: i.company_phone,
        company_email: i.company_email,

        brand_name: i.brand_name,
        years_of_operation_in_equipment: i.years_of_operation_in_equipment ?? null,
        years_of_operations: i.years_of_operations ?? null,

        location: i.location,

        inspection_date: inspectionDateTime,
        inspection_time: inspectionDateTime,

        photos: i.photos ?? null,

        gst: i.gst,
        billing_address: i.billing_address,

        equipment_type: i.equipment_type,
        equipment_sl_no: i.equipment_sl_no,
        capacity: i.capacity ?? null,

        specification_plate_photo: i.specification_plate_photo ?? null,

        poc_name: i.poc_name,
        poc_phone: i.poc_phone,
        poc_email: i.poc_email,

        problem_statement: i.problem_statement,
        possible_solution: i.possible_solution ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inspection: data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}
