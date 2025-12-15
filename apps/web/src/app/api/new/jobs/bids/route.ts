import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const user = await getUserSession();

    /**
     * Optional query params
     * /api/bids?job_id=uuid
     * /api/bids?user_id=uuid
     */
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');
    const userId = searchParams.get('user_id') || user?.user_id;

    let query = supabase.from('bids').select('*').order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

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
