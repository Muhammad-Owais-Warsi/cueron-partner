// Security utilities for JWT validation and HTTPS enforcement

/**
 * JWT token validation result
 */
export interface JWTValidationResult {
  valid: boolean;
  error?: string;
  payload?: any;
}

/**
 * Validate JWT token structure (basic validation)
 * Note: Full JWT validation should be done by Supabase Auth
 * This is for basic structure validation
 * @param token - JWT token to validate
 * @returns Validation result
 */
export function validateJWTStructure(token: string): JWTValidationResult {
  if (!token) {
    return {
      valid: false,
      error: 'Token is required',
    };
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  
  if (parts.length !== 3) {
    return {
      valid: false,
      error: 'Invalid token format',
    };
  }

  try {
    // Decode the payload (middle part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf8')
    );

    // Check for expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return {
          valid: false,
          error: 'Token has expired',
        };
      }
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid token encoding',
    };
  }
}

/**
 * Extract bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if request is using HTTPS
 * @param protocol - Request protocol
 * @param headers - Request headers
 * @returns True if HTTPS
 */
export function isHTTPS(
  protocol: string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  // Direct HTTPS check
  if (protocol === 'https') {
    return true;
  }

  // Check for proxy headers (common in production behind load balancers)
  const forwardedProto = headers['x-forwarded-proto'];
  if (forwardedProto === 'https') {
    return true;
  }

  return false;
}

/**
 * Enforce HTTPS for production environments
 * @param protocol - Request protocol
 * @param headers - Request headers
 * @param env - Environment (production, development, etc.)
 * @returns Object with shouldRedirect flag and redirectUrl if needed
 */
export function enforceHTTPS(
  protocol: string,
  headers: Record<string, string | string[] | undefined>,
  env: string = 'production'
): { shouldRedirect: boolean; redirectUrl?: string } {
  // Skip HTTPS enforcement in development
  if (env !== 'production') {
    return { shouldRedirect: false };
  }

  // Check if already HTTPS
  if (isHTTPS(protocol, headers)) {
    return { shouldRedirect: false };
  }

  // Build redirect URL
  const host = headers['host'] || headers['x-forwarded-host'];
  if (!host) {
    return { shouldRedirect: false };
  }

  const url = headers['x-forwarded-url'] || headers['url'];
  const redirectUrl = `https://${host}${url || ''}`;

  return {
    shouldRedirect: true,
    redirectUrl,
  };
}

/**
 * Sanitize input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
}

/**
 * Sanitize HTML content (more aggressive)
 * @param html - HTML string
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*>/gi, '') // Remove embed tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Sanitize file name to prevent path traversal
 * @param filename - File name
 * @returns Sanitized file name
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .trim();
}

/**
 * Validate email format
 * @param email - Email address
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format and protocol
 * @param url - URL string
 * @param allowedProtocols - Allowed protocols (default: http, https)
 * @returns True if valid URL
 */
export function validateURL(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol.replace(':', ''));
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize SQL-like input (basic protection)
 * Note: Use parameterized queries for actual SQL injection prevention
 * @param input - User input
 * @returns True if input appears safe
 */
export function validateSQLInput(input: string): boolean {
  if (!input) return true;

  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g, // SQL comments and statement terminators
    /(\bOR\b.*=.*)/gi, // OR 1=1 patterns
    /(\bUNION\b.*\bSELECT\b)/gi, // UNION SELECT patterns
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a secure random token
 * @param length - Token length in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rate limiting token bucket implementation
 */
export class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.tokens = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @returns True if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.tokens.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      this.tokens.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count < this.maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for identifier
   * @param identifier - Unique identifier
   * @returns Remaining requests
   */
  getRemaining(identifier: string): number {
    const record = this.tokens.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * Reset rate limit for identifier
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    this.tokens.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.tokens.entries()) {
      if (now > record.resetTime) {
        this.tokens.delete(key);
      }
    }
  }
}

/**
 * File upload validation
 */
export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

/**
 * Default file validation options for different file types
 */
export const FILE_VALIDATION_PRESETS = {
  images: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  documents: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },
  csv: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel'],
    allowedExtensions: ['.csv'],
  },
};

/**
 * Validate file upload
 * @param file - File object or file info
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateFileUpload(
  file: { name: string; size: number; type: string },
  options: FileValidationOptions
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > options.maxSizeBytes) {
    const maxSizeMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Check MIME type
  if (!options.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!options.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * CORS configuration helper
 */
export interface CORSConfig {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
}

/**
 * Get CORS headers based on configuration
 * @param config - CORS configuration
 * @param requestOrigin - Origin from request
 * @returns CORS headers
 */
export function getCORSHeaders(
  config: CORSConfig,
  requestOrigin?: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Handle origin
  if (typeof config.origin === 'string') {
    headers['Access-Control-Allow-Origin'] = config.origin;
  } else if (Array.isArray(config.origin) && requestOrigin) {
    if (config.origin.includes(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
    }
  }

  // Methods
  headers['Access-Control-Allow-Methods'] = config.methods.join(', ');

  // Headers
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');

  // Credentials
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Max age
  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
  }

  return headers;
}
