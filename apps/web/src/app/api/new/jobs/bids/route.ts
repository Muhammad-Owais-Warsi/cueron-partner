import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getUserSession();



    const query = supabase.from('bids').select('*').order('created_at', { ascending: false });


    const { data, error } = await query;

    if (error) {
      console.error('Fetch bids error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bids: data }, { status: 200 });
  } catch (err) {
    console.error('Get bids route error:', err);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}
