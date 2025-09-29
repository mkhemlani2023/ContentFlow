/**
 * Serper API Service Tests
 */
import axios from 'axios';
import { SerperApiService } from '../../services/serper-api.service';
import { cacheService } from '../../services/cache.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cache service
jest.mock('../../services/cache.service');
const mockedCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('SerperApiService', () => {
  let serperService: SerperApiService;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Mock cache service methods
    mockedCacheService.get.mockResolvedValue(null);
    mockedCacheService.set.mockResolvedValue(true);

    serperService = new SerperApiService();
  });

  describe('search', () => {
    const mockSerperResponse = global.testHelpers.createMockSerperResponse();

    it('should perform successful search', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: mockSerperResponse,
        status: 200,
        headers: {
          'x-ratelimit-remaining': '99',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': '1640995200',
        },
      });

      const params = {
        q: 'test query',
        gl: 'us',
        hl: 'en',
        num: 10,
      };

      const result = await serperService.search(params);

      expect(result).toEqual(mockSerperResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', params);
      expect(mockedCacheService.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const cachedResult = global.testHelpers.createMockSerperResponse({
        cached: true,
      });

      mockedCacheService.get.mockResolvedValue(cachedResult);

      const params = { q: 'test query' };
      const result = await serperService.search(params);

      expect(result).toEqual(cachedResult);
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const apiError = global.testHelpers.createMockApiError(500, 'Internal Server Error');
      mockAxiosInstance.post.mockRejectedValue(apiError);

      const params = { q: 'test query' };

      await expect(serperService.search(params)).rejects.toThrow('Internal Server Error');
    });

    it('should handle rate limiting', async () => {
      // First, simulate reaching rate limit
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockSerperResponse,
        status: 200,
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      });

      await serperService.search({ q: 'first query' });

      // Mock delay for rate limit reset
      jest.spyOn(global, 'setTimeout').mockImplementation(((callback: Function) => {
        callback();
        return {} as any;
      }) as any);

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockSerperResponse,
        status: 200,
        headers: {
          'x-ratelimit-remaining': '99',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      });

      const result = await serperService.search({ q: 'second query' });

      expect(result).toEqual(mockSerperResponse);
    });

    it('should generate correct cache key', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: mockSerperResponse,
        status: 200,
        headers: {},
      });

      const params = {
        q: 'Test Query',
        gl: 'us',
        hl: 'en',
        num: 10,
      };

      await serperService.search(params);

      // Verify cache.set was called with normalized parameters
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('serper:'),
        mockSerperResponse,
        { ttl: 900 }
      );
    });
  });

  describe('specialized search methods', () => {
    const mockResponse = global.testHelpers.createMockSerperResponse();

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: {},
      });
    });

    it('should perform images search', async () => {
      const params = { q: 'test images' };
      const result = await serperService.searchImages(params);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        ...params,
        type: 'images',
      });
    });

    it('should perform videos search', async () => {
      const params = { q: 'test videos' };
      const result = await serperService.searchVideos(params);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        ...params,
        type: 'videos',
      });
    });

    it('should perform news search', async () => {
      const params = { q: 'test news' };
      const result = await serperService.searchNews(params);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        ...params,
        type: 'news',
      });
    });

    it('should perform places search', async () => {
      const params = { q: 'test places' };
      const result = await serperService.searchPlaces(params);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        ...params,
        type: 'places',
      });
    });

    it('should perform scholar search', async () => {
      const params = { q: 'test scholar' };
      const result = await serperService.searchScholar(params);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        ...params,
        type: 'scholar',
      });
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = serperService.getMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('cachedRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('lastRequestTime');
      expect(metrics).toHaveProperty('rateLimitInfo');
    });
  });

  describe('getCircuitBreakerStatus', () => {
    it('should return circuit breaker status', () => {
      const status = serperService.getCircuitBreakerStatus();

      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('metrics');
      expect(status.state).toBe('CLOSED');
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should reset circuit breaker', () => {
      expect(() => serperService.resetCircuitBreaker()).not.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status on successful request', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {},
      });

      const health = await serperService.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.responseTime).toBeDefined();
      expect(health.rateLimitInfo).toBeDefined();
      expect(health.circuitBreakerState).toBeDefined();
    });

    it('should return unhealthy status on API error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const health = await serperService.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('API Error');
      expect(health.rateLimitInfo).toBeDefined();
      expect(health.circuitBreakerState).toBeDefined();
    });
  });

  describe('request queue processing', () => {
    it('should process requests in queue order', async () => {
      const responses = [
        { data: global.testHelpers.createMockSerperResponse({ position: 1 }), status: 200, headers: {} },
        { data: global.testHelpers.createMockSerperResponse({ position: 2 }), status: 200, headers: {} },
        { data: global.testHelpers.createMockSerperResponse({ position: 3 }), status: 200, headers: {} },
      ];

      mockAxiosInstance.post
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);

      // Make concurrent requests
      const promises = [
        serperService.search({ q: 'query 1' }),
        serperService.search({ q: 'query 2' }),
        serperService.search({ q: 'query 3' }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });
  });
});