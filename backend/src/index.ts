// IMPORTANT: Import instrument.ts first to initialize Sentry before everything else
import "./instrument.js";

import { logger } from "@/common/middleware/requestLogger.js";
import { env } from "@/common/utils/envConfig.js";
import { app } from "./server.js";

const startServer = () => {
	try {
		app.listen(env.PORT, "0.0.0.0", () => {
			logger.info(`🚀 Experience Miner backend listening on port ${env.PORT}`);
			logger.info(`📄 Health check: http://localhost:${env.PORT}/health`);
			logger.info(
				`🤖 API endpoints: http://localhost:${env.PORT}/api/interview`,
			);
			logger.info(`📝 Environment: ${env.NODE_ENV}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

// Graceful shutdown
process.on("SIGINT", () => {
	logger.info("🛑 Received SIGINT, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	logger.info("🛑 Received SIGTERM, shutting down gracefully...");
	process.exit(0);
});

startServer();
