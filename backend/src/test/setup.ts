import { vi } from "vitest";
import "dotenv/config";
import type { NextFunction, Request, Response } from "express";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.API_KEY = "test_gemini_api_key";
process.env.LOG_LEVEL = "error"; // Reduce noise in tests

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
export const createMockFile = (content: string, mimetype = "audio/webm") => ({
	buffer: Buffer.from(content),
	mimetype,
	originalname: "test-audio.webm",
	size: Buffer.from(content).length,
});

export const createMockRequest = (overrides = {}) => {
	const req = {
		body: {},
		params: {},
		query: {},
		headers: {},
		file: null,
		get: vi.fn(),
		header: vi.fn(),
		accepts: vi.fn(),
		acceptsCharsets: vi.fn(),
		acceptsEncodings: vi.fn(),
		acceptsLanguages: vi.fn(),
		// Add other required Request properties as needed
		...overrides,
	} as unknown as Request;
	return req;
};

export const createMockResponse = () => {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		getHeaders: vi.fn().mockReturnValue({}),
		sendStatus: vi.fn().mockReturnThis(),
		links: vi.fn().mockReturnThis(),
		jsonp: vi.fn().mockReturnThis(),
		sendFile: vi.fn().mockReturnThis(),
		// Add other required Response properties as needed
	} as unknown as Response & {
		[key: string]: unknown; // Allow for mock properties like .mock
	};
	return res;
};

export const createMockNext = () => vi.fn() as unknown as NextFunction;
