import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Add your permission check here
    // await assertPermission(session, 'engineer.delete');

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const supabase = createClient();

    const { error } = await supabase.from('requests').delete().eq('id', id);

    if (error) {
      console.error('Supabase Delete Error:', error);
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
    });
  } catch (err: any) {
    console.error('Delete Route Error:', err);

    if (err?.message?.includes('permission')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
