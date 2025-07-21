import pinoHttp from 'pino-http';
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino(
  isDevelopment
    ? {
        level: process.env.LOG_LEVEL || 'debug',
        transport: {
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
                destination: './logs/app.log',
                mkdir: true,
              },
              level: 'debug',
            },
          ],
        },
      }
    : {
        // Production: JSON logs to stdout (Railway/Docker captures)
        level: process.env.LOG_LEVEL || 'info',
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
);

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