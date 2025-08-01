import pino from "pino";
import pinoHttp from "pino-http";
import { serverConfig } from "@/config";

// Lazy configuration functions to avoid loading pino-pretty in production
const createDevelopmentConfig = (): pino.LoggerOptions => ({
	level: serverConfig.logLevel,
	transport: {
		targets: [
			{
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
				level: "info",
			},
			{
				target: "pino/file",
				options: {
					destination: "./logs/app.log",
					mkdir: true,
				},
				level: "debug",
			},
		],
	},
});

const createProductionConfig = (): pino.LoggerOptions => ({
	level: serverConfig.logLevel,
	formatters: {
		level: (label: string) => ({ level: label }),
	},
	timestamp: pino.stdTimeFunctions.isoTime,
});

const logger = pino(
	serverConfig.nodeEnv === "development"
		? createDevelopmentConfig()
		: createProductionConfig()
);

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
