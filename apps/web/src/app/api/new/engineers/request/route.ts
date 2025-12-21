import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils';

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔐 Only admin / manager
    // assertPermission(session.role, 'engineer:read');

    const supabase = createClient();

    const { data, error } = await supabase
      .from('new_engineers_requests')
      .select(
        `
        id,
        user_id,
        name,
        email,
        phone,
        created_at
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to fetch engineer requests' }, { status: 500 });
    }

    return NextResponse.json({
      requests: data ?? [],
    });
  } catch (err: any) {
    console.error(err);

    if (err?.message?.includes('permission')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
