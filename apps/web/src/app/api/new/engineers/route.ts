import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Extract agency_id from the request body
    const body = await request.json();
    const { agencyId } = body;
    console.log(body);
    if (!agencyId) {
      return NextResponse.json({ error: 'agency_id is required' }, { status: 400 });
    }

    // Query with filter
    const { data, error } = await supabase
      .from('new_engineers')
      .select('*')
      .eq('agency_id', agencyId) // Filtering by the ID provided
      .order('created_at', { ascending: false });

    console.log('dfsdwg', data);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
