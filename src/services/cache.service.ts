/**
 * Redis Cache Service Implementation
 */
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';
import { logger, logCacheEvent } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor(private readonly defaultOptions: CacheOptions = {}) {
    this.defaultOptions = {
      ttl: config.cache.ttlSeconds,
      prefix: 'content-flow',
      ...defaultOptions,
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password || undefined,
        database: config.redis.db,
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error', { error: error.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const keyPrefix = prefix ?? this.defaultOptions.prefix;
    return keyPrefix ? `${keyPrefix}:${key}` : key;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, cache miss', { key });
      logCacheEvent('GET', key, false);
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const value = await this.client.get(cacheKey);

      if (value === null) {
        logCacheEvent('GET', cacheKey, false);
        return null;
      }

      logCacheEvent('GET', cacheKey, true);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error: (error as Error).message });
      logCacheEvent('GET', key, false);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, cache set skipped', { key });
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const ttl = options?.ttl ?? this.defaultOptions.ttl ?? config.cache.ttlSeconds;
      const serializedValue = JSON.stringify(value);

      await this.client.setEx(cacheKey, ttl, serializedValue);

      logCacheEvent('SET', cacheKey, true, ttl);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, cache delete skipped', { key });
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const result = await this.client.del(cacheKey);

      logCacheEvent('DELETE', cacheKey, result > 0);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Set expiration time for existing key
   */
  async expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options?.prefix);
      const result = await this.client.expire(cacheKey, ttl);
      return result;
    } catch (error) {
      logger.error('Cache expire error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[], options?: CacheOptions): Promise<Array<T | null>> {
    if (!this.isConnected || !this.client || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options?.prefix));
      const values = await this.client.mGet(cacheKeys);

      return values.map((value, index) => {
        if (value === null) {
          logCacheEvent('MGET', cacheKeys[index]!, false);
          return null;
        }

        logCacheEvent('MGET', cacheKeys[index]!, true);
        return JSON.parse(value) as T;
      });
    } catch (error) {
      logger.error('Cache mget error', { keys, error: (error as Error).message });
      return keys.map(() => null);
    }
  }

  /**
   * Clear all keys with specific prefix
   */
  async clear(prefix?: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const pattern = this.generateKey('*', prefix);
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(keys);
      logger.info('Cache cleared', { pattern, deletedKeys: result });
      return result;
    } catch (error) {
      logger.error('Cache clear error', { prefix, error: (error as Error).message });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage?: string;
    info?: Record<string, string>;
  }> {
    const stats = {
      connected: this.isConnected,
      keyCount: 0,
      memoryUsage: undefined as string | undefined,
      info: undefined as Record<string, string> | undefined,
    };

    if (!this.isConnected || !this.client) {
      return stats;
    }

    try {
      // Get key count for our prefix
      const pattern = this.generateKey('*');
      const keys = await this.client.keys(pattern);
      stats.keyCount = keys.length;

      // Get Redis info
      const info = await this.client.info('memory');
      const infoLines = info.split('\r\n');
      const infoObj: Record<string, string> = {};

      for (const line of infoLines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key && value) {
            infoObj[key] = value;
          }
        }
      }

      stats.info = infoObj;
      stats.memoryUsage = infoObj.used_memory_human;

    } catch (error) {
      logger.error('Failed to get cache stats', { error: (error as Error).message });
    }

    return stats;
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    if (!this.isConnected || !this.client) {
      return { healthy: false, error: 'Not connected to Redis' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return { healthy: true, latency };
    } catch (error) {
      return { healthy: false, error: (error as Error).message };
    }
  }
}

// Global cache service instance
export const cacheService = new CacheService();