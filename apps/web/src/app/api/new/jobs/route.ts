import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Get the current user to filter "My Bids"
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch jobs with assigned user AND the current user's bids
    // We filter the bids join using the current user's ID
    const { data, error } = await supabase
      .from('new_jobs')
      .select(
        `
        *,
        assigned:users (
          email
        ),
        bids (
          id,
          job_id,
          price,
          user_id
        )
      `
      )
      // This ensures we only see bids in the array that WE created
      .eq('bids.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data }, { status: 200 });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
