import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto'; // Import the UUID generator

export async function POST(request: Request, { params }: { params: { agencyId: string } }) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { name, email, phone, agency_id } = body;

    if (!name || !email || !agency_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, or agency_id' },
        { status: 400 }
      );
    }

    // 2. Insert into the database
    const { data, error } = await supabase
      .from('new_engineers')
      .insert([
        {
          user_id: randomUUID(), // Generates a random valid UUID (v4)
          name,
          email,
          phone,
          agency_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
