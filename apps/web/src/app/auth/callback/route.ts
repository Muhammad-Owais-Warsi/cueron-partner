// import { createClient } from '@/lib/supabase/server';
// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(request: NextRequest) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get('code');
//   const error = requestUrl.searchParams.get('error');

//   if (error) {
//     console.error('Auth callback error from URL:', error);
//     return NextResponse.redirect(
//       new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin)
//     );
//   }

//   if (!code) {
//     console.error('No auth code provided');
//     return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
//   }

//   try {
//     const supabase = createClient();

//     const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

//     if (exchangeError) {
//       console.error('Error exchanging code for session:', exchangeError);
//       return NextResponse.redirect(
//         new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
//       );
//     }

//     if (!data?.user) {
//       console.error('No user data after exchange');
//       return NextResponse.redirect(new URL('/login?error=no_user', requestUrl.origin));
//     }

//     return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
//   } catch (error) {
//     console.error('Unexpected error in auth callback:', error);
//     return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin));
//   }
// }

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  // Check if user is verified (adjust field as needed)
  if (!data.user.email_confirmed_at) {
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
