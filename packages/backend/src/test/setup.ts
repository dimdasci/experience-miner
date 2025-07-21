import { vi } from 'vitest';
import 'dotenv/config';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.API_KEY = 'test_gemini_api_key';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Mock console methods to avoid noise unless explicitly testing them
  console.error = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Global test utilities
export const createMockFile = (content: string, mimetype = 'audio/webm') => ({
  buffer: Buffer.from(content),
  mimetype,
  originalname: 'test-audio.webm',
  size: Buffer.from(content).length,
});

export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  file: null,
  ...overrides,
});

export const createMockResponse = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    getHeaders: vi.fn().mockReturnValue({}),
  };
  return res;
};

export const createMockNext = () => vi.fn();