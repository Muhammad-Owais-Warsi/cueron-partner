import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('new_jobs')
      .select(
        'id, location, photos, assigned, price, equipment_type, equipment_sl_no, poc_name, poc_phone, poc_email,problem_statement, possible_solution, created_at'
      )
      .order('created_at', { ascending: false });

    console.log('DATA', data);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs: data }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
