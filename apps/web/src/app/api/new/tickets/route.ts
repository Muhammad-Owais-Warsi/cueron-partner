import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tickets')
      .select()
      .order('created_at', { ascending: false });

    console.log(data, data.length);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
