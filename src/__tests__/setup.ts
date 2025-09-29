/**
 * Test Setup Configuration
 */
import { config } from '../config/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SERPER_API_KEY = 'test-api-key';

// Mock Redis to avoid requiring actual Redis connection in tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    isOpen: true,
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    mGet: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    ping: jest.fn(),
  })),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testHelpers = {
  delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

  createMockSerperResponse: (overrides = {}) => ({
    searchParameters: { q: 'test query', type: 'search' },
    organic: [
      {
        position: 1,
        title: 'Test Title',
        link: 'https://example.com',
        snippet: 'Test snippet content',
      },
    ],
    credits: 1,
    ...overrides,
  }),

  createMockApiError: (status = 500, message = 'API Error') => {
    const error = new Error(message) as any;
    error.status = status;
    error.code = 'TEST_ERROR';
    return error;
  },
};

// Clean up after tests
afterAll(async () => {
  // Clean up any test resources
  jest.clearAllTimers();
  jest.restoreAllMocks();
});