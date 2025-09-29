/**
 * Circuit Breaker Implementation
 */
import {
  CircuitBreakerState,
  CircuitBreakerOptions,
  CircuitBreakerMetrics,
  CircuitBreakerEvents
} from '../types/circuit-breaker.types';
import { logger, logCircuitBreakerEvent } from './logger';

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttempt?: number;

  constructor(
    private readonly serviceName: string,
    private readonly options: CircuitBreakerOptions,
    private readonly events?: CircuitBreakerEvents
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      if (this.shouldAttemptReset()) {
        this.setState(CircuitBreakerState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${this.serviceName}. Next attempt: ${this.nextAttempt ? new Date(this.nextAttempt).toISOString() : 'unknown'}`);
      }
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess(result);
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      state: this.state,
      nextAttempt: this.nextAttempt,
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttempt = undefined;
    this.setState(CircuitBreakerState.CLOSED);

    logCircuitBreakerEvent(
      this.serviceName,
      'RESET',
      this.state,
      this.getMetrics()
    );
  }

  private isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  private isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  private isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN;
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) {
      return false;
    }
    return Date.now() >= this.nextAttempt;
  }

  private onSuccess(result: unknown): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.isHalfOpen()) {
      // Success in half-open state closes the circuit
      this.setState(CircuitBreakerState.CLOSED);
      this.failureCount = 0;
      this.nextAttempt = undefined;
    }

    this.events?.onSuccess?.(result, this.getMetrics());

    logCircuitBreakerEvent(
      this.serviceName,
      'SUCCESS',
      this.state,
      this.getMetrics()
    );
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.isHalfOpen()) {
      // Failure in half-open state reopens the circuit
      this.setState(CircuitBreakerState.OPEN);
      this.scheduleNextAttempt();
    } else if (this.isClosed() && this.failureCount >= this.options.failureThreshold) {
      // Too many failures in closed state opens the circuit
      this.setState(CircuitBreakerState.OPEN);
      this.scheduleNextAttempt();
    }

    this.events?.onFailure?.(error, this.getMetrics());

    logCircuitBreakerEvent(
      this.serviceName,
      'FAILURE',
      this.state,
      this.getMetrics()
    );
  }

  private setState(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      this.events?.onStateChange?.(newState, this.getMetrics());

      logCircuitBreakerEvent(
        this.serviceName,
        'STATE_CHANGE',
        newState,
        { oldState, newState, ...this.getMetrics() }
      );
    }
  }

  private scheduleNextAttempt(): void {
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }

  /**
   * Check if request should be executed based on monitoring window
   */
  private isWithinMonitoringWindow(): boolean {
    if (!this.lastFailureTime) {
      return true;
    }
    return Date.now() - this.lastFailureTime <= this.options.monitorTimeout;
  }
}

/**
 * Circuit Breaker Manager for multiple services
 */
export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create circuit breaker for a service
   */
  getCircuitBreaker(
    serviceName: string,
    options: CircuitBreakerOptions,
    events?: CircuitBreakerEvents
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker(serviceName, options, events)
      );
    }

    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      metrics[serviceName] = circuitBreaker.getMetrics();
    }

    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();