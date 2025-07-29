// IMPORTANT: Import instrument.ts first to initialize Sentry before everything else
import "./instrument.js";

import { logger } from "@/common/middleware/requestLogger.js";
import { databaseConfig, serverConfig } from "@/config/index.js";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { app } from "./server.js";

const startServer = async () => {
	try {
		// Initialize service container with providers
		logger.info("🔧 Initializing service container...");
		await ServiceContainer.getInstance().initialize();
		logger.info("✅ Service container initialized successfully");

		app.listen(serverConfig.port, "0.0.0.0", () => {
			logger.info(
				`🚀 Experience Miner backend listening on port ${serverConfig.port}`,
			);
			logger.info(
				`📄 Health check: http://localhost:${serverConfig.port}/health`,
			);
			logger.info(
				`🤖 API endpoints: http://localhost:${serverConfig.port}/api/interview`,
			);
			logger.info(`📝 Environment: ${serverConfig.nodeEnv}`);
			logger.info(`🤖 AI Provider: ${serverConfig.aiProvider}`);
			logger.info(`🗄️ Database: ${databaseConfig.connection.host}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
	logger.info(`🛑 Received ${signal}, shutting down gracefully...`);
	try {
		await ServiceContainer.getInstance().cleanup();
		logger.info("✅ Service container cleaned up successfully");
	} catch (error) {
		logger.error("Error during cleanup:", error);
	}
	process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer().catch((error) => {
	logger.error("Failed to start server:", error);
	process.exit(1);
});
