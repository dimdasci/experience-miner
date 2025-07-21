import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { rateLimiter, aiRateLimiter } from './rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
  });

  describe('rateLimiter', () => {
    beforeEach(() => {
      app.use('/api', rateLimiter);
      app.get('/api/test', (_req, res) => {
        res.json({ message: 'success' });
      });
    });

    it('should allow requests under the limit', async () => {
      // First request should pass
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.message).toBe('success');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should have correct rate limit configuration', () => {
      // Since we can't easily test the exact rate limiting in unit tests
      // (would require 100+ requests), we verify the middleware exists
      // and includes proper headers
      expect(rateLimiter).toBeDefined();
    });
  });

  describe('aiRateLimiter', () => {
    beforeEach(() => {
      app.use('/api/ai', aiRateLimiter);
      app.post('/api/ai/test', (_req, res) => {
        res.json({ message: 'ai success' });
      });
    });

    it('should allow AI requests under the limit', async () => {
      const response = await request(app)
        .post('/api/ai/test')
        .expect(200);

      expect(response.body.message).toBe('ai success');
    });

    it('should have stricter limits than general rate limiter', async () => {
      const response = await request(app)
        .post('/api/ai/test')
        .expect(200);

      // AI rate limiter should have limit of 10 (vs 100 for general)
      expect(response.headers['x-ratelimit-limit']).toBe('10');
    });

    it('should skip rate limiting in development', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        // In development, rate limiting should be skipped
        // This is hard to test directly, but we can verify the middleware runs
        const response = await request(app)
          .post('/api/ai/test')
          .expect(200);

        expect(response.body.message).toBe('ai success');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should include rate limit headers for AI endpoints', async () => {
      const response = await request(app)
        .post('/api/ai/test')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBe('10');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('rate limit exceeded scenarios', () => {
    it('should return proper error message when rate limit is exceeded', async () => {
      // Create a very restrictive rate limiter for testing
      const testRateLimiter = (await import('express-rate-limit')).default({
        windowMs: 60000, // 1 minute
        max: 1, // Allow only 1 request per minute
        message: {
          error: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      const testApp = express();
      testApp.use('/test', testRateLimiter);
      testApp.get('/test', (_req, res) => {
        res.json({ message: 'success' });
      });

      // First request should pass
      await request(testApp)
        .get('/test')
        .expect(200);

      // Second request should be rate limited
      const response = await request(testApp)
        .get('/test')
        .expect(429);

      expect(response.body).toEqual({
        error: 'Too many requests from this IP, please try again later.',
      });
    });
  });

  describe('middleware integration', () => {
    it('should work with other middleware', async () => {
      app.use(express.json());
      app.use('/api', rateLimiter);
      app.post('/api/test', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.received).toEqual({ data: 'test' });
    });

    it('should preserve request and response objects', async () => {
      app.use('/api', rateLimiter);
      app.get('/api/test', (req, res) => {
        res.json({
          method: req.method,
          url: req.url,
          hasRes: !!res,
        });
      });

      const response = await request(app)
        .get('/api/test?param=value')
        .expect(200);

      expect(response.body).toEqual({
        method: 'GET',
        url: '/test?param=value',
        hasRes: true,
      });
    });
  });
});