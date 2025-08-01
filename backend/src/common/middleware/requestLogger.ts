import pino from "pino";
import pinoHttp from "pino-http";
import { serverConfig } from "@/config";

// Simplified logger config to avoid issues with pino-pretty in production
const logger = pino({
	level: serverConfig.logLevel,
	// Only use pretty logging in development, simple JSON in production
	...(serverConfig.nodeEnv === "development" 
		? {
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				}
			}
		} 
		: {
			// Production: Minimal JSON logs
			formatters: {
				level: (label) => ({ level: label }),
			},
			timestamp: pino.stdTimeFunctions.isoTime,
		})
});

export const requestLogger = pinoHttp({
	logger,
	customLogLevel: (_req, res, _error) => {
		if (res.statusCode >= 400 && res.statusCode < 500) {
			return "warn";
		}
		if (res.statusCode >= 500) {
			return "error";
		}
		return "info";
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
			headers: serverConfig.nodeEnv === "development" ? req.headers : undefined,
		}),
		res: (res) => ({
			statusCode: res.statusCode,
			headers:
				serverConfig.nodeEnv === "development" && res.getHeaders
					? res.getHeaders()
					: undefined,
		}),
	},
});

export { logger };
