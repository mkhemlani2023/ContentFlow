/**
 * Logger Configuration using Winston
 */
import winston from 'winston';
import { config } from '../config/config';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'magenta',
};

winston.addColors(logColors);

const createLogger = (): winston.Logger => {
  const transports: winston.transport[] = [];

  // Console transport for development
  if (config.nodeEnv !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp as string} [${level}]: ${message as string}${metaStr}`;
          })
        ),
      })
    );
  }

  // File transport for production
  if (config.nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({
    levels: logLevels,
    level: config.logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports,
    exitOnError: false,
  });
};

export const logger = createLogger();

// Utility functions for structured logging
export const logApiRequest = (
  method: string,
  url: string,
  responseTime?: number,
  statusCode?: number,
  error?: Error
): void => {
  const logData = {
    method,
    url,
    responseTime,
    statusCode,
    error: error?.message,
  };

  if (error !== undefined) {
    logger.error('API Request Failed', logData);
  } else {
    logger.info('API Request Completed', logData);
  }
};

export const logCircuitBreakerEvent = (
  service: string,
  event: string,
  state: string,
  metrics?: Record<string, unknown>
): void => {
  logger.info('Circuit Breaker Event', {
    service,
    event,
    state,
    metrics,
  });
};

export const logCacheEvent = (
  operation: string,
  key: string,
  hit: boolean,
  ttl?: number
): void => {
  logger.debug('Cache Operation', {
    operation,
    key,
    hit,
    ttl,
  });
};