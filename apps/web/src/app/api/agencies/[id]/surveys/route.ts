import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('PARAMS', params);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('agency_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ surveys: data });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: { message: 'Failed to fetch surveys' } }, { status: 500 });
  }
}
