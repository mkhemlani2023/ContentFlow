/**
 * Circuit Breaker Types and Interfaces
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before trying to close circuit
  monitorTimeout: number; // Time window for monitoring failures
}

export interface CircuitBreakerMetrics {
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  state: CircuitBreakerState;
  nextAttempt?: number;
}

export interface CircuitBreakerEvents {
  onStateChange?: (state: CircuitBreakerState, metrics: CircuitBreakerMetrics) => void;
  onFailure?: (error: Error, metrics: CircuitBreakerMetrics) => void;
  onSuccess?: (result: unknown, metrics: CircuitBreakerMetrics) => void;
  onTimeout?: (metrics: CircuitBreakerMetrics) => void;
}