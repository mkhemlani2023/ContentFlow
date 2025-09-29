/**
 * Cache Service Tests
 */
import { CacheService } from '../../services/cache.service';
import { createClient } from 'redis';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  mGet: jest.fn(),
  keys: jest.fn(),
  info: jest.fn(),
  ping: jest.fn(),
  isOpen: true,
};

jest.mocked(createClient).mockReturnValue(mockRedisClient as any);

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({ prefix: 'test' });
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);

      await cacheService.connect();

      expect(createClient).toHaveBeenCalledWith({
        socket: {
          host: 'localhost',
          port: 6379,
        },
        password: undefined,
        database: 0,
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(cacheService.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      await cacheService.connect();
      await cacheService.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should get value from cache', async () => {
      const testData = { message: 'test data' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:test-key');
    });

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json');

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null when not connected', async () => {
      await cacheService.disconnect();

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should set value in cache with default TTL', async () => {
      const testData = { message: 'test data' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:test-key',
        900, // default TTL
        JSON.stringify(testData)
      );
    });

    it('should set value with custom TTL', async () => {
      const testData = { message: 'test data' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData, { ttl: 300 });

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:test-key',
        300,
        JSON.stringify(testData)
      );
    });

    it('should handle set errors', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Set failed'));

      const result = await cacheService.set('test-key', 'test-value');

      expect(result).toBe(false);
    });

    it('should return false when not connected', async () => {
      await cacheService.disconnect();

      const result = await cacheService.set('test-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:test-key');
    });

    it('should return false for non-existent key', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheService.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test:test-key');
    });

    it('should return false for non-existent key', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await cacheService.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should set expiration for existing key', async () => {
      mockRedisClient.expire.mockResolvedValue(true);

      const result = await cacheService.expire('test-key', 300);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test:test-key', 300);
    });
  });

  describe('mget', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should get multiple keys', async () => {
      const testData1 = { id: 1, name: 'test1' };
      const testData2 = { id: 2, name: 'test2' };

      mockRedisClient.mGet.mockResolvedValue([
        JSON.stringify(testData1),
        JSON.stringify(testData2),
        null,
      ]);

      const result = await cacheService.mget<typeof testData1>([
        'key1',
        'key2',
        'key3',
      ]);

      expect(result).toEqual([testData1, testData2, null]);
      expect(mockRedisClient.mGet).toHaveBeenCalledWith([
        'test:key1',
        'test:key2',
        'test:key3',
      ]);
    });

    it('should return nulls for empty keys array', async () => {
      const result = await cacheService.mget([]);

      expect(result).toEqual([]);
      expect(mockRedisClient.mGet).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should clear all keys with prefix', async () => {
      mockRedisClient.keys.mockResolvedValue(['test:key1', 'test:key2']);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheService.clear();

      expect(result).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['test:key1', 'test:key2']);
    });

    it('should return 0 when no keys found', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cacheService.clear();

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should return cache statistics', async () => {
      mockRedisClient.keys.mockResolvedValue(['test:key1', 'test:key2']);
      mockRedisClient.info.mockResolvedValue('used_memory_human:1M\r\nused_memory:1048576\r\n');

      const stats = await cacheService.getStats();

      expect(stats).toEqual({
        connected: true,
        keyCount: 2,
        memoryUsage: '1M',
        info: {
          used_memory_human: '1M',
          used_memory: '1048576',
        },
      });
    });

    it('should return basic stats when not connected', async () => {
      await cacheService.disconnect();

      const stats = await cacheService.getStats();

      expect(stats.connected).toBe(false);
      expect(stats.keyCount).toBe(0);
    });
  });

  describe('healthCheck', () => {
    beforeEach(async () => {
      await cacheService.connect();
    });

    it('should return healthy status', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const health = await cacheService.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeDefined();
      expect(health.error).toBeUndefined();
    });

    it('should return unhealthy status when ping fails', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Ping failed'));

      const health = await cacheService.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Ping failed');
    });

    it('should return unhealthy when not connected', async () => {
      await cacheService.disconnect();

      const health = await cacheService.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Not connected to Redis');
    });
  });
});