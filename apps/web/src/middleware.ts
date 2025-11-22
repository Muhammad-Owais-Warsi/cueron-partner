/**
 * Next.js Middleware for Security Hardening
 * Implements rate limiting, HTTPS enforcement, and CORS
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter, enforceHTTPS, getCORSHeaders } from '@cueron/utils';

// Rate limiter instance (100 requests per minute per IP)
const rateLimiter = new RateLimiter(100, 60000);

// CORS configuration for production
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://cueron.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Cleanup rate limiter every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get client identifier (IP address or user ID)
  const identifier = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api')) {
    if (!rateLimiter.isAllowed(identifier)) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            timestamp: new Date().toISOString(),
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const remaining = rateLimiter.getRemaining(identifier);
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return response;
  }

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const headers: Record<string, string | string[] | undefined> = {};
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const httpsCheck = enforceHTTPS(protocol, headers, process.env.NODE_ENV);
    
    if (httpsCheck.shouldRedirect && httpsCheck.redirectUrl) {
      return NextResponse.redirect(httpsCheck.redirectUrl, 301);
    }
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const corsHeaders = getCORSHeaders(corsConfig, origin || undefined);
    
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(corsConfig, origin || undefined);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
