/**
 * Circuit Breaker Tests
 */
import { CircuitBreaker, CircuitBreakerManager } from '../../utils/circuit-breaker';
import { CircuitBreakerState } from '../../types/circuit-breaker.types';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitorTimeout: 2000,
    });
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should open circuit after failure threshold is reached', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      }

      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.getMetrics().failureCount).toBe(3);

      // Next call should be rejected immediately
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(mockFn).toHaveBeenCalledTimes(3); // Should not be called again
    });

    it('should transition to half-open after reset timeout', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce('success');

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.OPEN);

      // Wait for reset timeout
      await global.testHelpers.delay(1100);

      // Next call should transition to half-open and succeed
      const result = await circuitBreaker.execute(mockFn);
      expect(result).toBe('success');
      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen circuit if failure occurs in half-open state', async () => {
      const mockFn = jest.fn()
        .mockRejectedValue(new Error('Service error'));

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      }

      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.OPEN);

      // Wait for reset timeout
      await global.testHelpers.delay(1100);

      // Fail in half-open state - should reopen circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = circuitBreaker.getMetrics();

      expect(metrics).toEqual({
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        lastFailureTime: undefined,
        lastSuccessTime: undefined,
        state: CircuitBreakerState.CLOSED,
        nextAttempt: undefined,
      });
    });

    it('should update metrics after successful execution', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      await circuitBreaker.execute(mockFn);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successCount).toBe(1);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.lastSuccessTime).toBeDefined();
    });

    it('should update metrics after failed execution', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(1);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.lastFailureTime).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker to closed state', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

      // Fail to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      expect(circuitBreaker.getMetrics().state).toBe(CircuitBreakerState.OPEN);

      // Reset circuit breaker
      circuitBreaker.reset();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.lastFailureTime).toBeUndefined();
      expect(metrics.nextAttempt).toBeUndefined();
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  describe('getCircuitBreaker', () => {
    it('should create new circuit breaker for new service', () => {
      const options = {
        failureThreshold: 3,
        resetTimeout: 1000,
        monitorTimeout: 2000,
      };

      const cb1 = manager.getCircuitBreaker('service1', options);
      const cb2 = manager.getCircuitBreaker('service1', options);

      expect(cb1).toBe(cb2); // Should return same instance
    });

    it('should create separate circuit breakers for different services', () => {
      const options = {
        failureThreshold: 3,
        resetTimeout: 1000,
        monitorTimeout: 2000,
      };

      const cb1 = manager.getCircuitBreaker('service1', options);
      const cb2 = manager.getCircuitBreaker('service2', options);

      expect(cb1).not.toBe(cb2); // Should be different instances
    });
  });

  describe('getAllMetrics', () => {
    it('should return metrics for all circuit breakers', () => {
      const options = {
        failureThreshold: 3,
        resetTimeout: 1000,
        monitorTimeout: 2000,
      };

      manager.getCircuitBreaker('service1', options);
      manager.getCircuitBreaker('service2', options);

      const metrics = manager.getAllMetrics();

      expect(Object.keys(metrics)).toEqual(['service1', 'service2']);
      expect(metrics.service1.state).toBe(CircuitBreakerState.CLOSED);
      expect(metrics.service2.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('resetAll', () => {
    it('should reset all circuit breakers', async () => {
      const options = {
        failureThreshold: 1,
        resetTimeout: 1000,
        monitorTimeout: 2000,
      };

      const cb1 = manager.getCircuitBreaker('service1', options);
      const cb2 = manager.getCircuitBreaker('service2', options);

      // Fail both circuit breakers
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));
      await expect(cb1.execute(mockFn)).rejects.toThrow();
      await expect(cb2.execute(mockFn)).rejects.toThrow();

      // Both should be open
      expect(cb1.getMetrics().state).toBe(CircuitBreakerState.OPEN);
      expect(cb2.getMetrics().state).toBe(CircuitBreakerState.OPEN);

      // Reset all
      manager.resetAll();

      // Both should be closed
      expect(cb1.getMetrics().state).toBe(CircuitBreakerState.CLOSED);
      expect(cb2.getMetrics().state).toBe(CircuitBreakerState.CLOSED);
    });
  });
});