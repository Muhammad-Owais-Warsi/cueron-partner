import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const client = await createClient();

    // We run all queries in parallel for better performance
    const [allJobs, openJobs, requests, agencies, surveys] = await Promise.all([
      // 1. All Jobs Count
      client.from('new_jobs').select('*', { count: 'exact', head: true }),

      // 2. Open Jobs (where assigned is null)
      client.from('new_jobs').select('*', { count: 'exact', head: true }).is('assigned', null), // Filters for null values

      // 3. Requests Count
      client.from('requests').select('*', { count: 'exact', head: true }),

      // 4. Agencies Count
      client.from('agencies').select('*', { count: 'exact', head: true }),

      // 5. Surveys Count
      client.from('surveys').select('*', { count: 'exact', head: true }),
    ]);

    // Check for errors in any of the responses
    const errors = [allJobs.error, requests.error, agencies.error, surveys.error].filter(Boolean);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0]?.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        stats: {
          totalJobs: allJobs.count || 0,
          openJobs: openJobs.count || 0,
          totalRequests: requests.count || 0,
          totalAgencies: agencies.count || 0,
          totalSurveys: surveys.count || 0,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Dashboard Route Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
