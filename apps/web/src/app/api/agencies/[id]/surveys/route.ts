import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { assertPermission } from '@cueron/utils';

function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('PARAMS', params);

    const supabase = await createClient();

    const session = await getUserSession();

    console.log('ewfwef', session);

    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401);
    }

    try {
      assertPermission(session.role, 'agency:read');
    } catch (error: any) {
      return errorResponse('FORBIDDEN', error.message, undefined, 403);
    }

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
