/**
 * API client with error handling and retry logic
 */

import { retryWithBackoff, parseError, AppError, ErrorCode } from '@cueron/utils/src/errors';
import { logError } from '@cueron/utils/src/monitoring';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryEnabled?: boolean;
  headers?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
}

/**
 * API Client class with built-in error handling and retry logic
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryEnabled: boolean;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.retryEnabled = config.retryEnabled !== false;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Make a request with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new AppError(
          ErrorCode.TIMEOUT_ERROR,
          'Request timed out',
          408
        );
      }
      
      throw error;
    }
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;
    const shouldRetry = options.retry !== false && this.retryEnabled;

    const requestFn = async (): Promise<T> => {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            ...options,
            headers: {
              ...this.defaultHeaders,
              ...options.headers,
            },
          },
          timeout
        );

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          throw new AppError(
            errorData.error?.code || ErrorCode.UNKNOWN_ERROR,
            errorData.error?.message || `Request failed with status ${response.status}`,
            response.status,
            errorData.error?.details
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        
        return (await response.text()) as any;
      } catch (error: any) {
        const appError = parseError(error);
        
        // Log critical errors
        if (appError.statusCode >= 500) {
          logError(appError, {
            extra: {
              url,
              method: options.method || 'GET',
            },
            tags: {
              api_client: 'web',
            },
          });
        }
        
        throw appError;
      }
    };

    // Execute with retry if enabled
    if (shouldRetry) {
      return retryWithBackoff(requestFn);
    }
    
    return requestFn();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    // Don't include Content-Type header - let browser set it with boundary
    const { 'Content-Type': _, ...restHeaders } = (options?.headers || {}) as Record<string, string>;

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: restHeaders,
      body: formData,
    });
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  retryEnabled: true,
});
