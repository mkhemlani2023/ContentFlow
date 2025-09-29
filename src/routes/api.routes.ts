/**
 * API Routes
 */
import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/error-handler';
import { serperApiService } from '../services/serper-api.service';
import { dataforSEOCompatibilityService } from '../services/dataforseo-compatibility.service';
import { SerperSearchParameters } from '../types/serper.types';

const router = Router();

// Validation schemas
const serperSearchSchema = Joi.object({
  q: Joi.string().required().max(500),
  gl: Joi.string().length(2).optional(),
  hl: Joi.string().length(2).optional(),
  num: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('search', 'images', 'videos', 'places', 'news', 'scholar').optional(),
  page: Joi.number().integer().min(1).max(10).optional(),
});

const keywordResearchSchema = Joi.object({
  keyword: Joi.string().required().max(500),
  location_name: Joi.string().optional(),
  language_name: Joi.string().optional(),
  depth: Joi.number().integer().min(1).max(100).optional(),
  include_seed_keyword: Joi.boolean().optional(),
  include_serp_info: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

const serpAnalysisSchema = Joi.object({
  keyword: Joi.string().required().max(500),
  location_name: Joi.string().optional(),
  language_name: Joi.string().optional(),
  device: Joi.string().valid('desktop', 'mobile', 'tablet').optional(),
  depth: Joi.number().integer().min(1).max(100).optional(),
});

/**
 * Validation middleware
 */
const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: Function): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.details[0]?.message ?? 'Invalid request data',
        details: error.details,
      });
      return;
    }
    next();
  };
};

/**
 * Serper API Direct Access Routes
 */

// Generic search endpoint
router.post('/serper/search',
  validate(serperSearchSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params: SerperSearchParameters = req.body;
    const result = await serperApiService.search(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Images search
router.post('/serper/images',
  validate(serperSearchSchema.fork(['type'], (schema) => schema.forbidden())),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = req.body;
    const result = await serperApiService.searchImages(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Videos search
router.post('/serper/videos',
  validate(serperSearchSchema.fork(['type'], (schema) => schema.forbidden())),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = req.body;
    const result = await serperApiService.searchVideos(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// News search
router.post('/serper/news',
  validate(serperSearchSchema.fork(['type'], (schema) => schema.forbidden())),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = req.body;
    const result = await serperApiService.searchNews(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Places search
router.post('/serper/places',
  validate(serperSearchSchema.fork(['type'], (schema) => schema.forbidden())),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = req.body;
    const result = await serperApiService.searchPlaces(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Scholar search
router.post('/serper/scholar',
  validate(serperSearchSchema.fork(['type'], (schema) => schema.forbidden())),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const params = req.body;
    const result = await serperApiService.searchScholar(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DataforSEO Compatibility Routes
 */

// Keyword research (DataforSEO compatible)
router.post('/v3/dataforseo_labs/google/keyword_ideas/live',
  validate(keywordResearchSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await dataforSEOCompatibilityService.getKeywordData(req.body);
    res.json(result);
  })
);

// SERP analysis (DataforSEO compatible)
router.post('/v3/serp/google/organic/live/advanced',
  validate(serpAnalysisSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await dataforSEOCompatibilityService.getSerpData(req.body);
    res.json(result);
  })
);

/**
 * Service Status and Metrics
 */

// Get Serper API metrics
router.get('/metrics/serper', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const metrics = serperApiService.getMetrics();
  const circuitBreakerStatus = serperApiService.getCircuitBreakerStatus();

  res.json({
    success: true,
    data: {
      ...metrics,
      circuitBreaker: circuitBreakerStatus,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Reset circuit breaker
router.post('/admin/circuit-breaker/reset', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  serperApiService.resetCircuitBreaker();

  res.json({
    success: true,
    message: 'Circuit breaker reset successfully',
    timestamp: new Date().toISOString(),
  });
}));

export { router as apiRoutes };