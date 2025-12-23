import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Check session if you want to protect this route
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Join with new_jobs table to get the 'assigned' column
    // We use new_jobs!inner to ensure we only get bids for existing jobs
    // Or just new_jobs(assigned) to get the data if it exists
    const { data, error } = await supabase
      .from('bids')
      .select(
        `
        *,
        new_jobs (
          assigned
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch bids error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optional: Flatten or map the data if you want to simplify the UI's job
    const formattedBids = data.map((bid: any) => ({
      ...bid,
      is_job_assigned: !!bid.new_jobs?.assigned,
      job_assigned_to: bid.new_jobs?.assigned, // This will be the user ID/email assigned to the job
    }));

    return NextResponse.json({ bids: formattedBids }, { status: 200 });
  } catch (err) {
    console.error('Get bids route error:', err);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}
