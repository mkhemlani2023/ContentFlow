/**
 * Application Configuration
 */
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),

  // Serper API Configuration
  SERPER_API_KEY: Joi.string().required(),
  SERPER_BASE_URL: Joi.string().uri().default('https://google.serper.dev'),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_DB: Joi.number().integer().min(0).max(15).default(0),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(100),

  // Circuit Breaker Configuration
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: Joi.number().integer().positive().default(5),
  CIRCUIT_BREAKER_RESET_TIMEOUT: Joi.number().integer().positive().default(30000),
  CIRCUIT_BREAKER_MONITOR_TIMEOUT: Joi.number().integer().positive().default(60000),

  // Cache Configuration
  CACHE_TTL_SECONDS: Joi.number().integer().positive().default(900), // 15 minutes

  // API Timeout Configuration
  API_TIMEOUT_MS: Joi.number().integer().positive().default(30000),
});

const { error, value } = configSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
});

if (error !== undefined) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

export interface Config {
  nodeEnv: string;
  port: number;
  logLevel: string;
  serper: {
    apiKey: string;
    baseUrl: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    monitorTimeout: number;
  };
  cache: {
    ttlSeconds: number;
  };
  api: {
    timeoutMs: number;
  };
}

export const config: Config = {
  nodeEnv: value.NODE_ENV as string,
  port: value.PORT as number,
  logLevel: value.LOG_LEVEL as string,
  serper: {
    apiKey: value.SERPER_API_KEY as string,
    baseUrl: value.SERPER_BASE_URL as string,
  },
  redis: {
    host: value.REDIS_HOST as string,
    port: value.REDIS_PORT as number,
    password: value.REDIS_PASSWORD as string,
    db: value.REDIS_DB as number,
  },
  rateLimiting: {
    windowMs: value.RATE_LIMIT_WINDOW_MS as number,
    maxRequests: value.RATE_LIMIT_MAX_REQUESTS as number,
  },
  circuitBreaker: {
    failureThreshold: value.CIRCUIT_BREAKER_FAILURE_THRESHOLD as number,
    resetTimeout: value.CIRCUIT_BREAKER_RESET_TIMEOUT as number,
    monitorTimeout: value.CIRCUIT_BREAKER_MONITOR_TIMEOUT as number,
  },
  cache: {
    ttlSeconds: value.CACHE_TTL_SECONDS as number,
  },
  api: {
    timeoutMs: value.API_TIMEOUT_MS as number,
  },
};