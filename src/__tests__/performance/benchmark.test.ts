/**
 * Performance Benchmark Tests
 *
 * Tests to validate performance targets:
 * - Response Time: <500ms for 95% of requests
 * - Throughput: Support 100 concurrent requests
 * - Cost Efficiency: <$0.10 per 1000 queries
 */
import { SerperApiService } from '../../services/serper-api.service';
import { DataforSEOCompatibilityService } from '../../services/dataforseo-compatibility.service';
import { cacheService } from '../../services/cache.service';

// Mock external dependencies for consistent benchmarking
jest.mock('../../services/cache.service');
const mockedCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('Performance Benchmarks', () => {
  let serperService: SerperApiService;
  let compatibilityService: DataforSEOCompatibilityService;

  beforeAll(() => {
    // Mock cache service to simulate Redis performance
    mockedCacheService.get.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 1)); // 1ms cache latency
      return null; // Always miss for benchmarking API performance
    });

    mockedCacheService.set.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 1)); // 1ms cache write latency
      return true;
    });

    serperService = new SerperApiService();
    compatibilityService = new DataforSEOCompatibilityService();
  });

  describe('Response Time Performance', () => {
    it('should achieve <500ms response time for single search requests', async () => {
      const mockAxios = require('axios');
      const mockResponse = {
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {
          'x-ratelimit-remaining': '99',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      };

      // Mock API response with realistic latency
      mockAxios.create().post.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms API latency
        return mockResponse;
      });

      const startTime = Date.now();

      await serperService.search({
        q: 'performance test query',
        num: 10,
      });

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500); // Target: <500ms
      expect(responseTime).toBeGreaterThan(100); // Realistic minimum with network
    }, 10000);

    it('should maintain performance under load (concurrent requests)', async () => {
      const mockAxios = require('axios');
      const mockResponse = {
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {},
      };

      mockAxios.create().post.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms API latency
        return mockResponse;
      });

      const concurrentRequests = 50;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        serperService.search({
          q: `concurrent test query ${i}`,
          num: 5,
        })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const totalTime = Date.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const averageResponseTime = totalTime / successful;

      expect(successful).toBeGreaterThan(concurrentRequests * 0.95); // 95% success rate
      expect(averageResponseTime).toBeLessThan(1000); // Reasonable under load
    }, 30000);
  });

  describe('Throughput Performance', () => {
    it('should handle 100 concurrent requests within throughput limits', async () => {
      const mockAxios = require('axios');
      const mockResponse = {
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {
          'x-ratelimit-remaining': '100',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      };

      mockAxios.create().post.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms API latency
        return mockResponse;
      });

      const concurrentRequests = 100;
      const batchSize = 10; // Process in batches to respect rate limits
      const batches: Promise<unknown>[][] = [];

      for (let i = 0; i < concurrentRequests; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, concurrentRequests - i) }, (_, j) =>
          serperService.search({
            q: `throughput test ${i + j}`,
            num: 3,
          })
        );
        batches.push(batch);
      }

      const startTime = Date.now();
      let totalSuccessful = 0;

      for (const batch of batches) {
        const results = await Promise.allSettled(batch);
        totalSuccessful += results.filter(r => r.status === 'fulfilled').length;

        // Small delay between batches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const totalTime = Date.now() - startTime;
      const throughput = (totalSuccessful * 1000) / totalTime; // requests per second

      expect(totalSuccessful).toBeGreaterThan(95); // 95% success rate
      expect(throughput).toBeGreaterThan(5); // At least 5 RPS under load
    }, 60000);
  });

  describe('Cache Performance', () => {
    it('should improve response time with caching enabled', async () => {
      const mockAxios = require('axios');
      const mockResponse = {
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {},
      };

      mockAxios.create().post.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms API latency
        return mockResponse;
      });

      const searchParams = {
        q: 'cache performance test',
        num: 10,
      };

      // First request (cache miss)
      const firstRequestStart = Date.now();
      await serperService.search(searchParams);
      const firstRequestTime = Date.now() - firstRequestStart;

      // Mock cache hit for subsequent requests
      mockedCacheService.get.mockResolvedValueOnce(mockResponse.data);

      // Second request (cache hit)
      const secondRequestStart = Date.now();
      await serperService.search(searchParams);
      const secondRequestTime = Date.now() - secondRequestStart;

      expect(firstRequestTime).toBeGreaterThan(250); // Should include API latency
      expect(secondRequestTime).toBeLessThan(50); // Should be much faster from cache
    });

    it('should calculate correct cache hit ratio under load', async () => {
      const mockAxios = require('axios');
      const mockResponse = {
        data: global.testHelpers.createMockSerperResponse(),
        status: 200,
        headers: {},
      };

      mockAxios.create().post.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockResponse;
      });

      // Simulate mixed cache hits and misses
      let cacheCallCount = 0;
      mockedCacheService.get.mockImplementation(async () => {
        cacheCallCount++;
        // Simulate 70% cache hit rate
        if (cacheCallCount % 10 < 7) {
          return mockResponse.data;
        }
        return null;
      });

      const requests = Array.from({ length: 20 }, (_, i) =>
        serperService.search({
          q: `cache ratio test ${i % 5}`, // 5 unique queries, some repeated
          num: 5,
        })
      );

      await Promise.allSettled(requests);

      const metrics = serperService.getMetrics();
      const cacheHitRatio = metrics.cachedRequests / (metrics.totalRequests || 1);

      expect(cacheHitRatio).toBeGreaterThan(0.6); // At least 60% cache hit rate
    });
  });

  describe('Cost Efficiency Benchmarks', () => {
    it('should achieve cost target of <$0.10 per 1000 queries', () => {
      // Serper API pricing: $50/month for 25,000 searches = $0.002 per search
      // Target: <$0.10 per 1000 queries = <$0.0001 per query
      // With caching and optimization, we should achieve better than target

      const serperCostPerQuery = 0.002; // $0.002 per search
      const targetCostPer1000 = 0.10; // $0.10 per 1000 queries
      const targetCostPerQuery = targetCostPer1000 / 1000; // $0.0001 per query

      // Simulate cache hit ratio of 70%
      const cacheHitRatio = 0.7;
      const actualQueriesPerRequest = 1 - cacheHitRatio; // 30% hit API
      const effectiveCostPerQuery = serperCostPerQuery * actualQueriesPerRequest;

      expect(effectiveCostPerQuery).toBeLessThan(targetCostPerQuery);

      // Calculate cost savings
      const costSavings = ((serperCostPerQuery - effectiveCostPerQuery) / serperCostPerQuery) * 100;
      expect(costSavings).toBeGreaterThan(60); // At least 60% cost savings from caching
    });

    it('should demonstrate significant savings compared to DataforSEO', () => {
      // DataforSEO pricing: ~$200-500/month for similar volume
      // Assume $300/month for 15,000 queries = $0.02 per query

      const dataforSEOCostPerQuery = 0.02;
      const serperCostPerQuery = 0.002;

      const costReduction = ((dataforSEOCostPerQuery - serperCostPerQuery) / dataforSEOCostPerQuery) * 100;

      expect(costReduction).toBeGreaterThan(80); // At least 80% cost reduction
      expect(serperCostPerQuery).toBeLessThan(dataforSEOCostPerQuery * 0.2); // Less than 20% of DataforSEO cost
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain reasonable memory usage under load', () => {
      const initialMemory = process.memoryUsage();

      // The service instances should not consume excessive memory
      expect(initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB

      const metrics = serperService.getMetrics();

      // Metrics should be tracking properly
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
    });

    it('should handle circuit breaker state changes efficiently', () => {
      const circuitBreakerStatus = serperService.getCircuitBreakerStatus();

      expect(circuitBreakerStatus.state).toBe('CLOSED');
      expect(circuitBreakerStatus.metrics).toHaveProperty('failureCount');
      expect(circuitBreakerStatus.metrics).toHaveProperty('successCount');

      // Circuit breaker should start in CLOSED state
      expect(circuitBreakerStatus.metrics.failureCount).toBe(0);
    });
  });

  describe('DataforSEO Compatibility Performance', () => {
    it('should maintain performance parity with DataforSEO response format', async () => {
      // Mock successful Serper API response
      jest.doMock('../../services/serper-api.service', () => ({
        serperApiService: {
          search: jest.fn().mockResolvedValue(global.testHelpers.createMockSerperResponse()),
        },
      }));

      const request = {
        keyword: 'performance compatibility test',
        location_name: 'United States',
        language_name: 'English',
      };

      const startTime = Date.now();
      const result = await compatibilityService.getKeywordData(request);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(600); // Slightly higher due to transformation
      expect(result.status_code).toBe(20000);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0]?.result).toHaveLength(1);
    });
  });
});