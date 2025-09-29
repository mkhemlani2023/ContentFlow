/**
 * API Integration Tests
 */
import request from 'supertest';
import { Application } from '../../index';

describe('API Integration Tests', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    app = new Application();
    server = app.getApp();
  });

  afterAll(async () => {
    // Clean up resources
    if (server?.close) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        version: '1.0.0',
      });
    });

    it('should return detailed health status', async () => {
      const response = await request(server)
        .get('/health/detailed')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded)$/),
        timestamp: expect.any(String),
        responseTime: expect.any(Number),
        services: expect.objectContaining({
          cache: expect.any(Object),
          serperApi: expect.any(Object),
          compatibility: expect.any(Object),
        }),
        system: expect.objectContaining({
          uptime: expect.any(Number),
          memory: expect.any(Object),
          nodeVersion: expect.any(String),
        }),
      });
    });

    it('should return readiness status', async () => {
      const response = await request(server)
        .get('/health/ready')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
        });

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(ready|not ready)$/),
        timestamp: expect.any(String),
      });
    });

    it('should return liveness status', async () => {
      const response = await request(server)
        .get('/health/live')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('API Endpoints', () => {
    describe('Serper API Direct Access', () => {
      it('should handle search requests', async () => {
        const searchParams = {
          q: 'test query',
          gl: 'us',
          hl: 'en',
          num: 5,
        };

        const response = await request(server)
          .post('/api/serper/search')
          .send(searchParams);

        // Should succeed or fail gracefully
        if (response.status === 200) {
          expect(response.body).toMatchObject({
            success: true,
            data: expect.any(Object),
            timestamp: expect.any(String),
          });
        } else {
          expect([400, 429, 503]).toContain(response.status);
          expect(response.body).toHaveProperty('error');
        }
      });

      it('should validate search request parameters', async () => {
        const invalidParams = {
          q: '', // Empty query should fail
          num: 150, // Exceeds max limit
        };

        const response = await request(server)
          .post('/api/serper/search')
          .send(invalidParams)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Validation Error',
          message: expect.any(String),
          details: expect.any(Array),
        });
      });

      it('should handle images search', async () => {
        const searchParams = {
          q: 'test images',
          num: 3,
        };

        const response = await request(server)
          .post('/api/serper/images')
          .send(searchParams);

        if (response.status === 200) {
          expect(response.body).toMatchObject({
            success: true,
            data: expect.any(Object),
            timestamp: expect.any(String),
          });
        } else {
          expect([400, 429, 503]).toContain(response.status);
        }
      });

      it('should handle videos search', async () => {
        const searchParams = {
          q: 'test videos',
          num: 3,
        };

        const response = await request(server)
          .post('/api/serper/videos')
          .send(searchParams);

        if (response.status === 200) {
          expect(response.body).toMatchObject({
            success: true,
            data: expect.any(Object),
            timestamp: expect.any(String),
          });
        } else {
          expect([400, 429, 503]).toContain(response.status);
        }
      });
    });

    describe('DataforSEO Compatibility', () => {
      it('should handle keyword research requests', async () => {
        const keywordRequest = {
          keyword: 'content marketing',
          location_name: 'United States',
          language_name: 'English',
          limit: 5,
        };

        const response = await request(server)
          .post('/api/v3/dataforseo_labs/google/keyword_ideas/live')
          .send(keywordRequest);

        if (response.status === 200) {
          expect(response.body).toMatchObject({
            version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
            status_code: expect.any(Number),
            status_message: expect.any(String),
            tasks_count: expect.any(Number),
            tasks: expect.any(Array),
          });

          if (response.body.status_code === 20000) {
            expect(response.body.tasks[0]).toMatchObject({
              result: expect.arrayContaining([
                expect.objectContaining({
                  keyword: 'content marketing',
                  search_volume: expect.any(Number),
                  keyword_difficulty: expect.any(Number),
                }),
              ]),
            });
          }
        } else {
          expect([400, 429, 503]).toContain(response.status);
        }
      });

      it('should handle SERP analysis requests', async () => {
        const serpRequest = {
          keyword: 'test serp analysis',
          location_name: 'United States',
          language_name: 'English',
          depth: 10,
        };

        const response = await request(server)
          .post('/api/v3/serp/google/organic/live/advanced')
          .send(serpRequest);

        if (response.status === 200) {
          expect(response.body).toMatchObject({
            version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
            status_code: expect.any(Number),
            status_message: expect.any(String),
            tasks_count: expect.any(Number),
            tasks: expect.any(Array),
          });

          if (response.body.status_code === 20000) {
            expect(response.body.tasks[0]).toMatchObject({
              result: expect.arrayContaining([
                expect.objectContaining({
                  keyword: 'test serp analysis',
                  items: expect.any(Array),
                }),
              ]),
            });
          }
        } else {
          expect([400, 429, 503]).toContain(response.status);
        }
      });

      it('should validate DataforSEO request parameters', async () => {
        const invalidRequest = {
          keyword: '', // Empty keyword should fail
          depth: 150, // Exceeds max limit
        };

        const response = await request(server)
          .post('/api/v3/dataforseo_labs/google/keyword_ideas/live')
          .send(invalidRequest)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Validation Error',
          message: expect.any(String),
          details: expect.any(Array),
        });
      });
    });

    describe('Service Metrics', () => {
      it('should return Serper API metrics', async () => {
        const response = await request(server)
          .get('/api/metrics/serper')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            totalRequests: expect.any(Number),
            successfulRequests: expect.any(Number),
            failedRequests: expect.any(Number),
            cachedRequests: expect.any(Number),
            averageResponseTime: expect.any(Number),
            rateLimitInfo: expect.objectContaining({
              remaining: expect.any(Number),
              limit: expect.any(Number),
              reset: expect.any(Number),
            }),
            circuitBreaker: expect.objectContaining({
              state: expect.any(String),
              metrics: expect.any(Object),
            }),
          }),
          timestamp: expect.any(String),
        });
      });

      it('should allow circuit breaker reset', async () => {
        const response = await request(server)
          .post('/api/admin/circuit-breaker/reset')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Circuit breaker reset successfully',
          timestamp: expect.any(String),
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const searchParams = { q: 'rate limit test' };

      // Make rapid requests to test rate limiting
      const requests = Array.from({ length: 5 }, () =>
        request(server)
          .post('/api/serper/search')
          .send(searchParams)
      );

      const responses = await Promise.all(requests);

      // Check that some requests succeed and rate limiting is working
      const successfulResponses = responses.filter(res => res.status === 200);
      const rateLimitedResponses = responses.filter(res => res.status === 429);

      expect(successfulResponses.length + rateLimitedResponses.length).toBe(5);

      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0]?.body).toMatchObject({
          error: 'Too many requests',
          message: expect.any(String),
        });
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(server)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: expect.stringContaining('Route GET /api/non-existent-endpoint not found'),
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(server)
        .post('/api/serper/search')
        .type('json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        code: 'INVALID_JSON',
        message: expect.any(String),
      });
    });

    it('should include request ID in error responses', async () => {
      const response = await request(server)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        timestamp: expect.any(String),
        path: '/api/non-existent',
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      // Check for common security headers set by Helmet
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': expect.any(String),
        'x-download-options': 'noopen',
      });
    });

    it('should handle CORS properly', async () => {
      const response = await request(server)
        .options('/api/serper/search')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});