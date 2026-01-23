/**
 * Amadeus API Error Classes
 * Based on patterns from amadeus-node/src/client/errors.js
 * 
 * Provides structured error handling for all Amadeus API interactions
 */

/**
 * Base class for all Amadeus API errors
 */
export class AmadeusAPIError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public details: any,
    message: string
  ) {
    super(message);
    this.name = 'AmadeusAPIError';
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Get developer-focused error details
   */
  getDebugInfo() {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Authentication/Authorization errors (401, 403)
 */
export class AmadeusAuthenticationError extends AmadeusAPIError {
  constructor(statusCode: number, details: any, message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', statusCode, details, message);
    this.name = 'AmadeusAuthenticationError';
  }

  getUserMessage(): string {
    return 'Unable to authenticate with Amadeus API. Please check your credentials.';
  }
}

/**
 * Resource not found errors (404)
 */
export class AmadeusNotFoundError extends AmadeusAPIError {
  constructor(details: any, message: string = 'Resource not found') {
    super('NOT_FOUND', 404, details, message);
    this.name = 'AmadeusNotFoundError';
  }

  getUserMessage(): string {
    return 'The requested resource was not found. Please check your search parameters.';
  }
}

/**
 * Rate limit errors (429)
 */
export class AmadeusRateLimitError extends AmadeusAPIError {
  public retryAfter?: number;

  constructor(details: any, retryAfter?: number, message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT_EXCEEDED', 429, details, message);
    this.name = 'AmadeusRateLimitError';
    this.retryAfter = retryAfter;
  }

  getUserMessage(): string {
    if (this.retryAfter) {
      return `Rate limit exceeded. Please try again in ${this.retryAfter} seconds.`;
    }
    return 'Rate limit exceeded. Please try again later.';
  }
}

/**
 * Client-side validation/request errors (400-499)
 */
export class AmadeusValidationError extends AmadeusAPIError {
  constructor(details: any, message: string = 'Validation error') {
    super('VALIDATION_ERROR', 400, details, message);
    this.name = 'AmadeusValidationError';
  }

  getUserMessage(): string {
    // Try to extract specific validation error from details
    if (this.details?.errors && Array.isArray(this.details.errors)) {
      const errorMessages = this.details.errors
        .map((err: any) => err.detail || err.title)
        .filter(Boolean)
        .join('; ');
      
      if (errorMessages) {
        return `Validation failed: ${errorMessages}`;
      }
    }
    
    return 'Invalid request parameters. Please check your input and try again.';
  }
}

/**
 * Server errors (500-599)
 */
export class AmadeusServerError extends AmadeusAPIError {
  constructor(statusCode: number, details: any, message: string = 'Server error') {
    super('SERVER_ERROR', statusCode, details, message);
    this.name = 'AmadeusServerError';
  }

  getUserMessage(): string {
    return 'The Amadeus API is experiencing issues. Please try again later.';
  }
}

/**
 * Network/connection errors
 */
export class AmadeusNetworkError extends AmadeusAPIError {
  constructor(details: any, message: string = 'Network error') {
    super('NETWORK_ERROR', 0, details, message);
    this.name = 'AmadeusNetworkError';
  }

  getUserMessage(): string {
    return 'Unable to connect to Amadeus API. Please check your internet connection.';
  }
}

/**
 * Response parsing errors
 */
export class AmadeusParseError extends AmadeusAPIError {
  constructor(details: any, message: string = 'Failed to parse response') {
    super('PARSE_ERROR', 0, details, message);
    this.name = 'AmadeusParseError';
  }

  getUserMessage(): string {
    return 'Received an unexpected response from Amadeus API.';
  }
}

/**
 * Parse Amadeus SDK error into our error classes
 */
export function parseAmadeusError(error: any): AmadeusAPIError {
  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return new AmadeusNetworkError(error, error.message);
  }

  // Extract status code from error response
  const statusCode = error.response?.statusCode || error.statusCode || 0;
  
  // Extract error details from Amadeus response
  let details = error.response?.result || error.response?.body || error;
  
  // Try to parse if it's a string
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      // Keep as string
    }
  }

  // Extract error message from Amadeus response
  let message = error.message || 'Unknown error';
  
  if (details?.errors && Array.isArray(details.errors) && details.errors.length > 0) {
    const firstError = details.errors[0];
    message = firstError.detail || firstError.title || message;
  }

  // Determine error type by status code
  if (statusCode === 401 || statusCode === 403) {
    return new AmadeusAuthenticationError(statusCode, details, message);
  }
  
  if (statusCode === 404) {
    return new AmadeusNotFoundError(details, message);
  }
  
  if (statusCode === 429) {
    const retryAfter = error.response?.headers?.['retry-after'];
    return new AmadeusRateLimitError(details, retryAfter ? parseInt(retryAfter) : undefined, message);
  }
  
  if (statusCode >= 400 && statusCode < 500) {
    return new AmadeusValidationError(details, message);
  }
  
  if (statusCode >= 500) {
    return new AmadeusServerError(statusCode, details, message);
  }

  // Default to generic API error
  return new AmadeusAPIError('UNKNOWN_ERROR', statusCode, details, message);
}

/**
 * Helper to check if an error is an Amadeus error
 */
export function isAmadeusError(error: any): error is AmadeusAPIError {
  return error instanceof AmadeusAPIError;
}

/**
 * Helper to get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isAmadeusError(error)) {
    return error.getUserMessage();
  }
  
  return error?.message || 'An unexpected error occurred';
}
