/**
 * API Security Helpers
 * Provides reusable security functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sanitizeInput,
  validateEmail,
  validateURL,
  validateFileUpload,
  validateSQLInput,
  FILE_VALIDATION_PRESETS,
  type FileValidationOptions,
} from '@cueron/utils';

/**
 * Sanitize request body fields
 * @param body - Request body object
 * @param fields - Fields to sanitize
 * @returns Sanitized body
 */
export function sanitizeRequestBody<T extends Record<string, any>>(
  body: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...body };

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      (sanitized as any)[field] = sanitizeInput(sanitized[field] as string);
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize query parameters
 * @param request - Next.js request
 * @param allowedParams - Allowed parameter names
 * @returns Validated parameters or error response
 */
export function validateQueryParams(
  request: NextRequest,
  allowedParams: string[]
): { valid: boolean; params?: Record<string, string>; error?: NextResponse } {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!allowedParams.includes(key)) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INVALID_PARAMETER',
              message: `Invalid query parameter: ${key}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      };
    }

    // Sanitize parameter value
    params[key] = sanitizeInput(value);

    // Check for SQL injection patterns
    if (!validateSQLInput(params[key])) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: `Invalid input detected in parameter: ${key}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      };
    }
  }

  return { valid: true, params };
}

/**
 * Validate file upload from request
 * @param file - File from request
 * @param preset - Validation preset or custom options
 * @returns Validation result or error response
 */
export function validateFileFromRequest(
  file: { name: string; size: number; type: string },
  preset: keyof typeof FILE_VALIDATION_PRESETS | FileValidationOptions
): { valid: boolean; error?: NextResponse } {
  const options =
    typeof preset === 'string' ? FILE_VALIDATION_PRESETS[preset] : preset;

  const result = validateFileUpload(file, options);

  if (!result.valid) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE',
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate email in request body
 * @param email - Email address
 * @returns Validation result or error response
 */
export function validateEmailInput(
  email: string
): { valid: boolean; error?: NextResponse } {
  if (!validateEmail(email)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Validate URL in request body
 * @param url - URL string
 * @param allowedProtocols - Allowed protocols
 * @returns Validation result or error response
 */
export function validateURLInput(
  url: string,
  allowedProtocols?: string[]
): { valid: boolean; error?: NextResponse } {
  if (!validateURL(url, allowedProtocols)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INVALID_URL',
            message: 'Invalid URL format or protocol',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Create a secure error response that doesn't leak sensitive information
 * @param error - Error object
 * @param statusCode - HTTP status code
 * @returns NextResponse with sanitized error
 */
export function createSecureErrorResponse(
  error: Error,
  statusCode: number = 500
): NextResponse {
  // In production, don't expose internal error details
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An error occurred processing your request'
      : error.message;

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}

/**
 * Validate request content type
 * @param request - Next.js request
 * @param expectedType - Expected content type
 * @returns Validation result or error response
 */
export function validateContentType(
  request: NextRequest,
  expectedType: string
): { valid: boolean; error?: NextResponse } {
  const contentType = request.headers.get('content-type');

  if (!contentType || !contentType.includes(expectedType)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: `Expected content type: ${expectedType}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 415 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Sanitize path parameters to prevent path traversal
 * @param params - Path parameters
 * @returns Sanitized parameters
 */
export function sanitizePathParams<T extends Record<string, string>>(
  params: T
): T {
  const sanitized = { ...params } as T;

  for (const key in sanitized) {
    // Remove any path traversal attempts
    (sanitized as any)[key] = sanitized[key]
      .replace(/\.\./g, '')
      .replace(/[\/\\]/g, '')
      .trim();
  }

  return sanitized;
}

/**
 * Validate UUID format
 * @param id - UUID string
 * @returns True if valid UUID
 */
export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate UUID in request
 * @param id - UUID string
 * @param paramName - Parameter name for error message
 * @returns Validation result or error response
 */
export function validateUUIDInput(
  id: string,
  paramName: string = 'id'
): { valid: boolean; error?: NextResponse } {
  if (!validateUUID(id)) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          error: {
            code: 'INVALID_ID',
            message: `Invalid ${paramName} format`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}
