import pinoHttp from 'pino-http';
import pino from 'pino';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const isDevelopment = process.env.NODE_ENV === 'development';
const __dirname = dirname(fileURLToPath(import.meta.url));

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        targets: [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
            level: 'info',
          },
          {
            target: 'pino/file',
            options: {
              destination: join(__dirname, '../../../logs/app.log'),
              mkdir: true,
            },
            level: 'debug',
          },
        ],
      }
    : {
        target: 'pino/file',
        options: {
          destination: join(__dirname, '../../../logs/app.log'),
          mkdir: true,
        },
      },
});

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, _error) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    }
    if (res.statusCode >= 500) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req, res, error) => {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${error.message}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: isDevelopment ? req.headers : undefined,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: isDevelopment && res.getHeaders ? res.getHeaders() : undefined,
    }),
  },
});

export { logger };