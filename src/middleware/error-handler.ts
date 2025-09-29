/**
 * Express Error Handler Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { SerperApiError } from '../types/serper.types';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Default error values
  let status = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: Record<string, unknown> | undefined;

  // Handle different error types
  if (error instanceof SerperApiError || (error as ApiError).status) {
    const apiError = error as ApiError;
    status = apiError.status ?? 500;
    message = apiError.message || 'API Error';
    code = apiError.code ?? 'API_ERROR';
    details = apiError.details;
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = { validation: error.message };
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    status = 400;
    message = 'Invalid JSON in request body';
    code = 'INVALID_JSON';
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (error.message.includes('Circuit breaker is OPEN')) {
    status = 503;
    message = 'Service temporarily unavailable';
    code = 'SERVICE_UNAVAILABLE';
    details = { reason: 'Circuit breaker is open' };
  } else if (error.message.includes('Rate limit exceeded')) {
    status = 429;
    message = 'Too Many Requests';
    code = 'RATE_LIMITED';
  }

  // Log error details
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status,
      code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query,
    },
  });

  // Build error response
  const errorResponse: {
    error: string;
    message: string;
    code: string;
    timestamp: string;
    path: string;
    details?: Record<string, unknown>;
    stack?: string;
  } = {
    error: getErrorName(status),
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(status).json(errorResponse);
};

/**
 * Get error name from status code
 */
function getErrorName(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 504:
      return 'Gateway Timeout';
    default:
      return 'Error';
  }
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};