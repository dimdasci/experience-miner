export const creditsConfig = {
	// Pricing rates (environment variables for different tiers)
	rates: {
		transcriber: 0.5,
		extractor: 0.25,
		topicGeneration: 0.75,
		topicReranking: 0.75,
	},

	// User management settings (operational configuration)
	userLocks: {
		timeoutMs: 300000, // 5 minutes
		maxConcurrentOperations: 1,
		retryAttempts: 3,
		retryDelayMs: 1000,
	},

	// Credit limits and warnings (operational configuration)
	limits: {
		minimumBalance: 0,
		warningThreshold: 10, // Warn when user has < 10 credits
		dailySpendingLimit: 100, // Max credits per day per user
	},

	// Transaction settings
	transactions: {
		enableLogging: true,
		batchSize: 100, // For bulk credit operations
	},
};
