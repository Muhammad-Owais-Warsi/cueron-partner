import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { job_id, user_id, bid_id } = await req.json();

    if (!job_id || !user_id || !bid_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: job, error: jobError } = await supabase
      .from('new_jobs')
      .select('id, assigned')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.assigned) {
      return NextResponse.json({ error: 'Job already assigned' }, { status: 409 });
    }

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('id, job_id, user_id')
      .eq('id', bid_id)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    if (bid.job_id !== job_id || bid.user_id !== user_id) {
      return NextResponse.json({ error: 'Bid does not match job or user' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('new_jobs')
      .update({ assigned: user_id })
      .eq('id', job_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Job assigned successfully',
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
