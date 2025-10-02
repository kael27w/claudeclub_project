/**
 * API Error Handling Utilities
 * Centralized error handling for all external API integrations
 */

import {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  ExternalApiError,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from '../types/external-apis';

// ============================================================================
// ERROR HANDLER
// ============================================================================

export class ApiErrorHandler {
  /**
   * Wrap API calls with standardized error handling
   */
  static async handleApiCall<T>(
    apiCall: () => Promise<T>,
    source: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<ApiResponse<T>> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: ExternalApiError | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const data = await apiCall();
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            source,
          },
        };
      } catch (error) {
        lastError = this.normalizeError(error, source);

        // Don't retry if error is not retryable or it's the last attempt
        if (!lastError.retryable || attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.warn(
          `[${source}] Attempt ${attempt + 1}/${config.maxRetries + 1} failed. Retrying in ${delay}ms...`,
          lastError.message
        );

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: lastError?.toJSON(),
      meta: {
        timestamp: new Date().toISOString(),
        source,
      },
    };
  }

  /**
   * Normalize various error types into ExternalApiError
   */
  private static normalizeError(error: unknown, source: string): ExternalApiError {
    // Already an ExternalApiError
    if (error instanceof ExternalApiError) {
      return error;
    }

    // HTTP errors with status codes
    if (this.isHttpError(error)) {
      return this.handleHttpError(error, source);
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return new ExternalApiError(
        ApiErrorCode.NETWORK_ERROR,
        `Network error in ${source}: ${(error as Error).message}`,
        undefined,
        { originalError: String(error) },
        true // Retryable
      );
    }

    // Generic errors
    if (error instanceof Error) {
      return new ExternalApiError(
        ApiErrorCode.UNKNOWN_ERROR,
        `Unknown error in ${source}: ${error.message}`,
        undefined,
        { originalError: error.message },
        false
      );
    }

    // Completely unknown error type
    return new ExternalApiError(
      ApiErrorCode.UNKNOWN_ERROR,
      `Unknown error in ${source}: ${String(error)}`,
      undefined,
      { originalError: String(error) },
      false
    );
  }

  /**
   * Handle HTTP errors with status codes
   */
  private static handleHttpError(error: unknown, source: string): ExternalApiError {
    const statusCode = this.getStatusCode(error);
    const message = this.getErrorMessage(error);

    switch (statusCode) {
      case 401:
        return new ExternalApiError(
          ApiErrorCode.AUTHENTICATION_FAILED,
          `Authentication failed for ${source}: ${message}`,
          401,
          { source },
          false
        );

      case 403:
        return new ExternalApiError(
          ApiErrorCode.INVALID_API_KEY,
          `Invalid API key for ${source}: ${message}`,
          403,
          { source },
          false
        );

      case 429:
        return new ExternalApiError(
          ApiErrorCode.RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded for ${source}: ${message}`,
          429,
          { source, retryAfter: this.getRetryAfter(error) },
          true
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new ExternalApiError(
          ApiErrorCode.SERVICE_UNAVAILABLE,
          `Service unavailable for ${source}: ${message}`,
          statusCode,
          { source },
          true
        );

      case 400:
        return new ExternalApiError(
          ApiErrorCode.INVALID_PARAMS,
          `Invalid parameters for ${source}: ${message}`,
          400,
          { source },
          false
        );

      case 404:
        return new ExternalApiError(
          ApiErrorCode.NO_DATA_FOUND,
          `No data found for ${source}: ${message}`,
          404,
          { source },
          false
        );

      default:
        return new ExternalApiError(
          ApiErrorCode.UNKNOWN_ERROR,
          `HTTP error ${statusCode} for ${source}: ${message}`,
          statusCode,
          { source },
          false
        );
    }
  }

  /**
   * Check if error is an HTTP error
   */
  private static isHttpError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('status' in error || 'statusCode' in error || 'response' in error)
    );
  }

  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('fetch failed')
    );
  }

  /**
   * Extract status code from various error formats
   */
  private static getStatusCode(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }

    if (
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null
    ) {
      const response = error.response as Record<string, unknown>;
      if ('status' in response && typeof response.status === 'number') {
        return response.status;
      }
    }

    return undefined;
  }

  /**
   * Extract error message from various error formats
   */
  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;

    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }

      if (
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null
      ) {
        const response = error.response as Record<string, unknown>;
        if ('data' in response && typeof response.data === 'object' && response.data !== null) {
          const data = response.data as Record<string, unknown>;
          if ('message' in data && typeof data.message === 'string') {
            return data.message;
          }
        }
      }
    }

    return 'Unknown error';
  }

  /**
   * Extract retry-after header value
   */
  private static getRetryAfter(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;

    if (
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null
    ) {
      const response = error.response as Record<string, unknown>;
      if (
        'headers' in response &&
        typeof response.headers === 'object' &&
        response.headers !== null
      ) {
        const headers = response.headers as Record<string, unknown>;
        const retryAfter = headers['retry-after'] || headers['Retry-After'];
        if (typeof retryAfter === 'string' || typeof retryAfter === 'number') {
          return Number(retryAfter);
        }
      }
    }

    return undefined;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// GRACEFUL DEGRADATION HELPER
// ============================================================================

export class GracefulDegradation {
  /**
   * Try multiple data sources in priority order
   */
  static async tryMultipleSources<T>(
    sources: Array<{
      name: string;
      fetch: () => Promise<T>;
      required?: boolean;
    }>,
    minRequired: number = 1
  ): Promise<{
    results: Array<{ source: string; data?: T; error?: ApiError }>;
    success: boolean;
    successCount: number;
  }> {
    const results: Array<{ source: string; data?: T; error?: ApiError }> = [];
    let successCount = 0;

    for (const source of sources) {
      try {
        const data = await source.fetch();
        results.push({ source: source.name, data });
        successCount++;
      } catch (error) {
        const apiError =
          error instanceof ExternalApiError
            ? error.toJSON()
            : {
                code: ApiErrorCode.UNKNOWN_ERROR,
                message: error instanceof Error ? error.message : String(error),
              };

        results.push({ source: source.name, error: apiError });

        // If this source is required and failed, stop trying others
        if (source.required) {
          break;
        }
      }
    }

    return {
      results,
      success: successCount >= minRequired,
      successCount,
    };
  }

  /**
   * Fallback to cached data if API fails
   */
  static async withCacheFallback<T>(
    apiCall: () => Promise<T>,
    cacheGetter: () => Promise<T | null>,
    cacheSetter: (data: T) => Promise<void>
  ): Promise<T> {
    try {
      const data = await apiCall();
      // Update cache on success
      await cacheSetter(data);
      return data;
    } catch (error) {
      console.warn('API call failed, attempting cache fallback:', error);
      const cachedData = await cacheGetter();
      if (cachedData) {
        console.log('Using cached data as fallback');
        return cachedData;
      }
      // No cache available, rethrow error
      throw error;
    }
  }
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

export function createErrorResponse(error: unknown, source: string): ApiResponse<never> {
  const apiError =
    error instanceof ExternalApiError
      ? error.toJSON()
      : {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        };

  return {
    success: false,
    error: apiError,
    meta: {
      timestamp: new Date().toISOString(),
      source,
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  source: string,
  cached: boolean = false
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      source,
      cached,
    },
  };
}
