/**
 * Error handling utilities for the Cueron Partner Platform
 * Provides standardized error types, retry logic, and error formatting
 */

/**
 * Standard error codes used across the platform
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_SESSION = 'AUTH_EXPIRED_SESSION',
  AUTH_INVALID_OTP = 'AUTH_INVALID_OTP',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  MAPS_API_ERROR = 'MAPS_API_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  SMS_DELIVERY_ERROR = 'SMS_DELIVERY_ERROR',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    request_id?: string;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode | string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, string[]>,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * User-friendly error messages for common error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ErrorCode.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
  [ErrorCode.CONNECTION_ERROR]: 'Connection lost. Please check your internet connection.',
  
  [ErrorCode.AUTH_INVALID_TOKEN]: 'Your session is invalid. Please log in again.',
  [ErrorCode.AUTH_EXPIRED_SESSION]: 'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_INVALID_OTP]: 'Invalid OTP. Please check and try again.',
  [ErrorCode.AUTH_REQUIRED]: 'Please log in to continue.',
  
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions for this action.',
  
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.DUPLICATE_ENTRY]: 'This entry already exists in the system.',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided. Please check and try again.',
  
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
  [ErrorCode.QUERY_TIMEOUT]: 'The operation took too long. Please try again.',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'This operation violates data constraints.',
  
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit.',
  [ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported.',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed. Please try again.',
  
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service is temporarily unavailable.',
  [ErrorCode.MAPS_API_ERROR]: 'Unable to load map data. Please try again.',
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'Payment processing failed. Please try again.',
  [ErrorCode.SMS_DELIVERY_ERROR]: 'Unable to send SMS. Please try again.',
  
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong. Please try again later.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message for an error code
 */
export function getUserFriendlyMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Calculate delay for exponential backoff
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
    return true;
  }
  
  // Specific error codes
  if (error.code === ErrorCode.NETWORK_ERROR || error.code === ErrorCode.TIMEOUT_ERROR) {
    return true;
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable or if this was the last attempt
      if (!isRetryableError(error) || attempt === retryConfig.maxAttempts) {
        throw error;
      }
      
      // Calculate delay and wait before next attempt
      const delay = calculateBackoffDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Parse error into AppError
 */
export function parseError(error: any): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new AppError(
      ErrorCode.CONNECTION_ERROR,
      getUserFriendlyMessage(ErrorCode.CONNECTION_ERROR),
      503
    );
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new AppError(
      ErrorCode.TIMEOUT_ERROR,
      getUserFriendlyMessage(ErrorCode.TIMEOUT_ERROR),
      408
    );
  }
  
  // HTTP errors
  if (error.response) {
    const statusCode = error.response.status;
    const data = error.response.data;
    
    if (statusCode === 401) {
      return new AppError(
        ErrorCode.AUTH_REQUIRED,
        data?.error?.message || getUserFriendlyMessage(ErrorCode.AUTH_REQUIRED),
        401
      );
    }
    
    if (statusCode === 403) {
      return new AppError(
        ErrorCode.FORBIDDEN,
        data?.error?.message || getUserFriendlyMessage(ErrorCode.FORBIDDEN),
        403
      );
    }
    
    if (statusCode === 400 && data?.error?.code === ErrorCode.VALIDATION_ERROR) {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        data.error.message,
        400,
        data.error.details
      );
    }
    
    return new AppError(
      data?.error?.code || ErrorCode.UNKNOWN_ERROR,
      data?.error?.message || getUserFriendlyMessage(ErrorCode.UNKNOWN_ERROR),
      statusCode
    );
  }
  
  // Generic error
  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    error.message || getUserFriendlyMessage(ErrorCode.UNKNOWN_ERROR),
    500
  );
}

/**
 * Check if error is a critical error that should be reported to monitoring
 */
export function isCriticalError(error: AppError): boolean {
  const criticalCodes = [
    ErrorCode.DATABASE_ERROR,
    ErrorCode.QUERY_TIMEOUT,
    ErrorCode.INTERNAL_ERROR,
  ];
  
  return criticalCodes.includes(error.code as ErrorCode) || error.statusCode >= 500;
}
