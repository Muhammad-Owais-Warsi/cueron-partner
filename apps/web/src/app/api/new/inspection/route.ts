import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('inspection')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ inspections: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}
