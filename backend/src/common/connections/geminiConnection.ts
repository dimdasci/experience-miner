import { GoogleGenAI } from "@google/genai";
import * as Sentry from "@sentry/node";
import { aiConfig } from "@/config/ai.js";

interface RateLimitConfig {
	requestsPerMinute: number;
	requestsPerDay: number;
	backoffMultiplier: number;
	maxRetries: number;
}

interface RequestTracker {
	requests: number[];
	dailyRequests: number;
	lastReset: Date;
}

/**
 * Gemini AI Connection Manager
 * Handles rate limiting, connection reuse, retry logic, and monitoring
 */
export class GeminiConnection {
	private client: GoogleGenAI;
	private rateLimitConfig: RateLimitConfig;
	private requestTracker: RequestTracker;
	private isHealthy: boolean = true;

	constructor(apiKey?: string, rateLimitConfig?: Partial<RateLimitConfig>) {
		this.client = new GoogleGenAI({
			apiKey: apiKey || aiConfig.apiKey,
		});

		this.rateLimitConfig = {
			...aiConfig.rateLimits,
			...rateLimitConfig,
		};

		this.requestTracker = {
			requests: [],
			dailyRequests: 0,
			lastReset: new Date(),
		};

		// Test connection on startup
		this.testConnection();
	}

	private async testConnection(): Promise<void> {
		try {
			// Simple test request to verify API key and connectivity
			await this.client.models.generateContent({
				model: aiConfig.models.transcription,
				contents: [{ parts: [{ text: "Test connection" }] }],
			});

			this.isHealthy = true;
			Sentry.logger?.info?.("Gemini AI connection established successfully");
		} catch (error) {
			this.isHealthy = false;
			Sentry.logger?.error?.("Failed to connect to Gemini AI", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	private resetDailyCounterIfNeeded(): void {
		const now = new Date();
		const timeSinceLastReset =
			now.getTime() - this.requestTracker.lastReset.getTime();
		const oneDayMs = 24 * 60 * 60 * 1000;

		if (timeSinceLastReset >= oneDayMs) {
			this.requestTracker.dailyRequests = 0;
			this.requestTracker.lastReset = now;
		}
	}

	private canMakeRequest(): { allowed: boolean; waitTime?: number } {
		this.resetDailyCounterIfNeeded();

		// Check daily limit
		if (
			this.requestTracker.dailyRequests >= this.rateLimitConfig.requestsPerDay
		) {
			const msUntilReset =
				24 * 60 * 60 * 1000 -
				(Date.now() - this.requestTracker.lastReset.getTime());
			return {
				allowed: false,
				waitTime: msUntilReset,
			};
		}

		// Check per-minute limit
		const now = Date.now();
		const oneMinuteAgo = now - 60000;

		// Remove old requests
		this.requestTracker.requests = this.requestTracker.requests.filter(
			(timestamp) => timestamp > oneMinuteAgo,
		);

		if (
			this.requestTracker.requests.length >=
			this.rateLimitConfig.requestsPerMinute
		) {
			const oldestRequest = Math.min(...this.requestTracker.requests);
			const waitTime = 60000 - (now - oldestRequest);
			return {
				allowed: false,
				waitTime: Math.max(0, waitTime),
			};
		}

		return { allowed: true };
	}

	private trackRequest(): void {
		const now = Date.now();
		this.requestTracker.requests.push(now);
		this.requestTracker.dailyRequests++;

		// Log usage for monitoring
		Sentry.logger?.debug?.("Gemini API request tracked", {
			requestsThisMinute: this.requestTracker.requests.length,
			requestsToday: this.requestTracker.dailyRequests,
			dailyLimit: this.rateLimitConfig.requestsPerDay,
		});
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async generateContent(request: any): Promise<any> {
		if (!this.isHealthy) {
			throw new Error("Gemini AI connection is not healthy");
		}

		let attempt = 0;
		let backoffMs = 1000;

		while (attempt < this.rateLimitConfig.maxRetries) {
			// Check rate limits
			const rateLimitCheck = this.canMakeRequest();
			if (!rateLimitCheck.allowed && rateLimitCheck.waitTime) {
				if (rateLimitCheck.waitTime > 5000) {
					// If wait is > 5 seconds, reject
					throw new Error(
						`Rate limit exceeded. Wait ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds.`,
					);
				}
				await this.sleep(rateLimitCheck.waitTime);
			}

			try {
				this.trackRequest();
				const result = await this.client.models.generateContent(request);

				// Reset backoff on success
				backoffMs = 1000;

				Sentry.logger?.debug?.("Gemini API request successful", {
					attempt: attempt + 1,
					model: request.model,
				});

				return result;
			} catch (error) {
				attempt++;

				Sentry.logger?.warn?.("Gemini API request failed", {
					attempt,
					maxRetries: this.rateLimitConfig.maxRetries,
					error: error instanceof Error ? error.message : "Unknown error",
					backoffMs,
				});

				if (attempt >= this.rateLimitConfig.maxRetries) {
					this.isHealthy = false;
					Sentry.captureException(error, {
						tags: { service: "gemini", operation: "generateContent" },
						extra: { attempts: attempt, finalBackoff: backoffMs },
					});
					throw new Error(
						`Gemini AI request failed after ${attempt} attempts: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					);
				}

				// Exponential backoff
				await this.sleep(backoffMs);
				backoffMs *= this.rateLimitConfig.backoffMultiplier;
			}
		}

		throw new Error("Unexpected end of retry loop");
	}

	getHealthStatus(): {
		healthy: boolean;
		requestsThisMinute: number;
		requestsToday: number;
		dailyLimitRemaining: number;
	} {
		this.resetDailyCounterIfNeeded();

		const now = Date.now();
		const oneMinuteAgo = now - 60000;
		const currentMinuteRequests = this.requestTracker.requests.filter(
			(timestamp) => timestamp > oneMinuteAgo,
		).length;

		return {
			healthy: this.isHealthy,
			requestsThisMinute: currentMinuteRequests,
			requestsToday: this.requestTracker.dailyRequests,
			dailyLimitRemaining:
				this.rateLimitConfig.requestsPerDay - this.requestTracker.dailyRequests,
		};
	}

	async close(): Promise<void> {
		// GoogleGenAI doesn't have a close method, but we can mark as unhealthy
		this.isHealthy = false;
		Sentry.logger?.info?.("Gemini connection closed");
	}
}

// Singleton instance
export const geminiConnection = new GeminiConnection();
