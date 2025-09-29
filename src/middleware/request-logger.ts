/**
 * Request Logging Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Extend Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.id = uuidv4();
  req.startTime = Date.now();

  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Capture original res.end to log response
  const originalEnd = res.end;

  res.end = function(chunk?: unknown, encoding?: BufferEncoding | (() => void)): Response {
    const responseTime = Date.now() - req.startTime;

    // Log response
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type'),
    });

    // Call original end method
    if (typeof encoding === 'function') {
      return originalEnd.call(this, chunk, encoding);
    } else {
      return originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};