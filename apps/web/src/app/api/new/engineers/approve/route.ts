import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils';

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔐 Admin only
    assertPermission(session.role, 'engineer:create');

    const supabase = createClient();

    /* -------------------------------------------------- */
    /* 1️⃣ Fetch engineer request */
    /* -------------------------------------------------- */
    const { data: request, error: requestError } = await supabase
      .from('new_engineers_requests')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: 'Engineer request not found' }, { status: 404 });
    }

    /* -------------------------------------------------- */
    /* 2️⃣ Insert / Update users table */
    /* -------------------------------------------------- */
    const { error: userError } = await supabase.from('users').insert({
      id: request.user_id,
      email: request.email,
      role: 'engineer',
    });

    if (userError) {
      console.error(userError);
      return NextResponse.json({ error: 'Failed to create user entry' }, { status: 500 });
    }

    /* -------------------------------------------------- */
    /* 3️⃣ Insert into new_engineers */
    /* -------------------------------------------------- */
    const { error: engineerError } = await supabase.from('new_engineers').insert({
      user_id: request.user_id,
      name: request.name,
      email: request.email,
      agency_id: request.agency_id,
      phone: request.phone,
      created_at: new Date().toISOString(),
    });

    if (engineerError) {
      console.error(engineerError);
      return NextResponse.json({ error: 'Failed to create engineer profile' }, { status: 500 });
    }

    /* -------------------------------------------------- */
    /* 4️⃣ Delete request */
    /* -------------------------------------------------- */
    const { error: deleteError } = await supabase
      .from('new_engineers_requests')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error(deleteError);
      return NextResponse.json(
        { error: 'Engineer created but request cleanup failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Engineer approved successfully',
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
