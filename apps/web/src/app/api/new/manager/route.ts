import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const client = await createClient();

    // 1. Parse the body
    const body = await req.json();
    const { agency_id } = body;

    // 2. MANDATE: Check if agency_id exists
    if (!agency_id) {
      return NextResponse.json(
        { error: 'Unauthorized: agency_id is mandated for this route.' },
        { status: 400 }
      );
    }

    // 3. Query with strict equality filter
    const { count: engineerCount, error } = await client
      .from('new_engineers')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agency_id); // This is now mandatory

    if (error) {
      console.error('Manager Fetch Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        stats: {
          totalEngineers: engineerCount || 0,
          agencyIdUsed: agency_id,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Manager Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
