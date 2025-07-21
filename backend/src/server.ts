import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Application } from 'express';

import { env } from '@/common/utils/envConfig.js';
import { requestLogger } from '@/common/middleware/requestLogger.js';
import { errorHandler } from '@/common/middleware/errorHandler.js';
import { rateLimiter, aiRateLimiter } from '@/common/middleware/rateLimiter.js';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter.js';
import { interviewRouter } from '@/api/interview/interviewRouter.js';

const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173'] 
    : env.FRONTEND_URL ? [`https://${env.FRONTEND_URL}`] : false,
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/health', healthCheckRouter);
app.use('/api/interview', aiRateLimiter, interviewRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Experience Miner API',
    version: '0.1.0',
    health: '/health',
    endpoints: {
      transcribe: 'POST /api/interview/transcribe',
      extract: 'POST /api/interview/extract',
    },
  });
});

// Error handling (must be last)
app.use(errorHandler);

export { app };