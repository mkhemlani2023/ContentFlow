/**
 * Health Check Routes
 */
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { cacheService } from '../services/cache.service';
import { serperApiService } from '../services/serper-api.service';
import { dataforSEOCompatibilityService } from '../services/dataforseo-compatibility.service';
import { circuitBreakerManager } from '../utils/circuit-breaker';

const router = Router();

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
  });
}));

/**
 * Detailed health check with all services
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  // Check all services in parallel
  const [cacheHealth, serperHealth, compatibilityHealth] = await Promise.allSettled([
    cacheService.healthCheck(),
    serperApiService.healthCheck(),
    dataforSEOCompatibilityService.healthCheck(),
  ]);

  const responseTime = Date.now() - startTime;

  // Get cache stats
  const cacheStats = await cacheService.getStats();

  // Get API metrics
  const serperMetrics = serperApiService.getMetrics();

  // Get circuit breaker states
  const circuitBreakerStates = circuitBreakerManager.getAllMetrics();

  // Determine overall health
  const allHealthy = [cacheHealth, serperHealth, compatibilityHealth].every(
    result => result.status === 'fulfilled' && result.value.healthy
  );

  const status = allHealthy ? 'healthy' : 'degraded';
  const httpStatus = allHealthy ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    responseTime,
    services: {
      cache: {
        status: cacheHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: cacheHealth.status === 'fulfilled' ? cacheHealth.value : { error: 'Service check failed' },
        stats: cacheStats,
      },
      serperApi: {
        status: serperHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: serperHealth.status === 'fulfilled' ? serperHealth.value : { error: 'Service check failed' },
        metrics: serperMetrics,
      },
      compatibility: {
        status: compatibilityHealth.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: compatibilityHealth.status === 'fulfilled' ? compatibilityHealth.value : { error: 'Service check failed' },
      },
    },
    circuitBreakers: circuitBreakerStates,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
}));

/**
 * Readiness probe (for Kubernetes)
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check if essential services are ready
  const cacheReady = await cacheService.healthCheck();

  if (!cacheReady.healthy) {
    res.status(503).json({
      status: 'not ready',
      message: 'Cache service not ready',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Liveness probe (for Kubernetes)
 */
router.get('/live', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Basic liveness check - just return 200 if process is running
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

export { router as healthRoutes };