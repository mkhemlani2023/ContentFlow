/**
 * Content Flow Application Entry Point
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { cacheService } from './services/cache.service';
import { apiRoutes } from './routes/api.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

class Application {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS middleware
    this.app.use(cors({
      origin: config.nodeEnv === 'production' ? false : true,
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Rate limiting middleware
    const rateLimiter = rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.maxRequests,
      message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api', rateLimiter);

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use(requestLogger);
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check routes (no rate limiting)
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Content Flow API',
        version: '1.0.0',
        description: 'Automated content generation and multi-platform posting tool with Serper API integration',
        status: 'operational',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      // Initialize cache service
      logger.info('Initializing cache service...');
      await cacheService.connect();

      // Start the server
      const server = this.app.listen(config.port, () => {
        logger.info(`Content Flow API started on port ${config.port}`, {
          environment: config.nodeEnv,
          port: config.port,
          processId: process.pid,
        });
      });

      // Graceful shutdown handling
      const gracefulShutdown = async (signal: string): Promise<void> => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);

        server.close(async () => {
          logger.info('HTTP server closed');

          try {
            await cacheService.disconnect();
            logger.info('Cache service disconnected');
          } catch (error) {
            logger.error('Error disconnecting cache service', {
              error: (error as Error).message,
            });
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start application', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      process.exit(1);
    }
  }

  /**
   * Get Express application instance
   */
  getApp(): express.Application {
    return this.app;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new Application();
  app.start().catch((error) => {
    logger.error('Application startup failed', { error: error.message });
    process.exit(1);
  });
}

export { Application };