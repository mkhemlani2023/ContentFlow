/**
 * Serper API Service Implementation
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  SerperSearchParameters,
  SerperSearchResponse,
  SerperApiError,
} from '../types/serper.types';
import { config } from '../config/config';
import { logger, logApiRequest } from '../utils/logger';
import { circuitBreakerManager } from '../utils/circuit-breaker';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { cacheService } from './cache.service';

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface SerperApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  averageResponseTime: number;
  lastRequestTime: number;
}

export class SerperApiService {
  private client: AxiosInstance;
  private circuitBreaker: CircuitBreaker;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private metrics: SerperApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: 0,
  };

  // Rate limiting state
  private rateLimitInfo: RateLimitInfo = {
    remaining: config.rateLimiting.maxRequests,
    reset: Date.now() + config.rateLimiting.windowMs,
    limit: config.rateLimiting.maxRequests,
  };

  constructor() {
    this.client = this.createAxiosInstance();
    this.circuitBreaker = circuitBreakerManager.getCircuitBreaker(
      'serper-api',
      config.circuitBreaker,
      {
        onStateChange: (state, metrics) => {
          logger.warn('Serper API Circuit Breaker state changed', { state, metrics });
        },
        onFailure: (error, metrics) => {
          logger.error('Serper API Circuit Breaker failure', { error: error.message, metrics });
        },
      }
    );
  }

  /**
   * Create configured Axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: config.serper.baseUrl,
      timeout: config.api.timeoutMs,
      headers: {
        'X-API-KEY': config.serper.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Content-Flow/1.0.0',
      },
    });

    // Request interceptor
    instance.interceptors.request.use(
      (requestConfig) => {
        const startTime = Date.now();
        requestConfig.metadata = { startTime };

        logger.debug('Serper API request started', {
          method: requestConfig.method,
          url: requestConfig.url,
          params: requestConfig.params,
        });

        return requestConfig;
      },
      (error) => {
        logger.error('Serper API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        const responseTime = Date.now() - (response.config.metadata?.startTime ?? Date.now());
        this.updateRateLimitInfo(response);
        this.updateMetrics(responseTime, true);

        logApiRequest(
          response.config.method?.toUpperCase() ?? 'UNKNOWN',
          response.config.url ?? '',
          responseTime,
          response.status
        );

        return response;
      },
      (error) => {
        const responseTime = Date.now() - (error.config?.metadata?.startTime ?? Date.now());
        this.updateMetrics(responseTime, false);

        if (error.response) {
          this.updateRateLimitInfo(error.response);
        }

        const apiError: SerperApiError = new Error(error.message) as SerperApiError;
        apiError.status = error.response?.status ?? 0;
        apiError.code = error.code ?? 'UNKNOWN_ERROR';
        apiError.details = error.response?.data;

        logApiRequest(
          error.config?.method?.toUpperCase() ?? 'UNKNOWN',
          error.config?.url ?? '',
          responseTime,
          error.response?.status,
          apiError
        );

        return Promise.reject(apiError);
      }
    );

    return instance;
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(response: AxiosResponse): void {
    const headers = response.headers;

    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining'] as string, 10);
    }

    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.reset = parseInt(headers['x-ratelimit-reset'] as string, 10) * 1000;
    }

    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo.limit = parseInt(headers['x-ratelimit-limit'] as string, 10);
    }
  }

  /**
   * Update service metrics
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = Date.now();

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Calculate running average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (totalResponseTime + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Check if rate limit allows request
   */
  private canMakeRequest(): boolean {
    if (Date.now() >= this.rateLimitInfo.reset) {
      // Reset rate limit window
      this.rateLimitInfo.remaining = this.rateLimitInfo.limit;
      this.rateLimitInfo.reset = Date.now() + config.rateLimiting.windowMs;
    }

    return this.rateLimitInfo.remaining > 0;
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(params: SerperSearchParameters): string {
    const normalizedParams = {
      q: params.q.toLowerCase().trim(),
      gl: params.gl ?? 'us',
      hl: params.hl ?? 'en',
      num: params.num ?? 10,
      type: params.type ?? 'search',
    };

    return `serper:${Buffer.from(JSON.stringify(normalizedParams)).toString('base64')}`;
  }

  /**
   * Execute request with rate limiting and circuit breaker
   */
  private async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest = async (): Promise<void> => {
        try {
          if (!this.canMakeRequest()) {
            const waitTime = this.rateLimitInfo.reset - Date.now();
            if (waitTime > 0) {
              logger.warn('Rate limit exceeded, waiting', { waitTime });
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }

          const result = await this.circuitBreaker.execute(requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue().catch(reject);
    });
  }

  /**
   * Process request queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        if (request) {
          await request();
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Perform search with caching
   */
  async search(params: SerperSearchParameters): Promise<SerperSearchResponse> {
    const cacheKey = this.generateCacheKey(params);

    // Try to get from cache first
    try {
      const cachedResult = await cacheService.get<SerperSearchResponse>(cacheKey);
      if (cachedResult) {
        this.metrics.cachedRequests++;
        logger.debug('Returning cached search result', { cacheKey, params });
        return cachedResult;
      }
    } catch (error) {
      logger.warn('Cache retrieval failed', { error: (error as Error).message, cacheKey });
    }

    // Make API request
    const result = await this.executeRequest(async () => {
      const response = await this.client.post<SerperSearchResponse>('/search', params);
      return response.data;
    });

    // Cache the result
    try {
      await cacheService.set(cacheKey, result, { ttl: config.cache.ttlSeconds });
      logger.debug('Cached search result', { cacheKey, params });
    } catch (error) {
      logger.warn('Cache storage failed', { error: (error as Error).message, cacheKey });
    }

    return result;
  }

  /**
   * Perform images search
   */
  async searchImages(params: Omit<SerperSearchParameters, 'type'>): Promise<SerperSearchResponse> {
    return this.search({ ...params, type: 'images' });
  }

  /**
   * Perform videos search
   */
  async searchVideos(params: Omit<SerperSearchParameters, 'type'>): Promise<SerperSearchResponse> {
    return this.search({ ...params, type: 'videos' });
  }

  /**
   * Perform news search
   */
  async searchNews(params: Omit<SerperSearchParameters, 'type'>): Promise<SerperSearchResponse> {
    return this.search({ ...params, type: 'news' });
  }

  /**
   * Perform places search
   */
  async searchPlaces(params: Omit<SerperSearchParameters, 'type'>): Promise<SerperSearchResponse> {
    return this.search({ ...params, type: 'places' });
  }

  /**
   * Perform scholar search
   */
  async searchScholar(params: Omit<SerperSearchParameters, 'type'>): Promise<SerperSearchResponse> {
    return this.search({ ...params, type: 'scholar' });
  }

  /**
   * Get current service metrics
   */
  getMetrics(): SerperApiMetrics & { rateLimitInfo: RateLimitInfo } {
    return {
      ...this.metrics,
      rateLimitInfo: { ...this.rateLimitInfo },
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): {
    state: string;
    metrics: ReturnType<CircuitBreaker['getMetrics']>;
  } {
    return {
      state: this.circuitBreaker.getMetrics().state,
      metrics: this.circuitBreaker.getMetrics(),
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    responseTime?: number;
    error?: string;
    rateLimitInfo: RateLimitInfo;
    circuitBreakerState: string;
  }> {
    try {
      const start = Date.now();

      // Make a simple search request to test connectivity
      await this.search({
        q: 'test',
        num: 1,
      });

      const responseTime = Date.now() - start;

      return {
        healthy: true,
        responseTime,
        rateLimitInfo: { ...this.rateLimitInfo },
        circuitBreakerState: this.circuitBreaker.getMetrics().state,
      };
    } catch (error) {
      return {
        healthy: false,
        error: (error as Error).message,
        rateLimitInfo: { ...this.rateLimitInfo },
        circuitBreakerState: this.circuitBreaker.getMetrics().state,
      };
    }
  }
}

// Global Serper API service instance
export const serperApiService = new SerperApiService();