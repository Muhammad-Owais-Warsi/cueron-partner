import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } } // agency_id
) {
  try {
    const supabase = await createClient();

    const agency_id = params.id;

    const body = await req.json();
    console.log('Incoming survey body:', body);

    const { engineer_id, job_number, description, equipments_required, amount, photos } = body;

    if (!engineer_id || !job_number || !description || !equipments_required) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- Insert into Supabase ---
    const { data, error } = await supabase
      .from('surveys')
      .insert([
        {
          agency_id, // from params
          engineer_id,
          job_number,
          description,
          equipments_required,
          amount: amount ?? null,
          photos: photos ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: 'Survey created successfully', survey: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
