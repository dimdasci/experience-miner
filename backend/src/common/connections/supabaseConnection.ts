import * as Sentry from "@sentry/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authConfig } from "@/config/auth.js";

interface ConnectionHealth {
	healthy: boolean;
	lastCheck: Date;
	consecutiveFailures: number;
}

/**
 * Supabase Connection Manager
 * Handles client lifecycle, health monitoring, and connection reuse
 */
export class SupabaseConnection {
	private client: SupabaseClient;
	private health: ConnectionHealth;
	private readonly maxConsecutiveFailures: number;
	private readonly healthCheckIntervalMs: number;

	constructor() {
		this.client = createClient(
			authConfig.supabase.url,
			authConfig.supabase.anonKey,
			{
				...authConfig.supabase.options,
				db: { schema: "public" },
			},
		);

		this.health = {
			healthy: true,
			lastCheck: new Date(),
			consecutiveFailures: 0,
		};

		this.maxConsecutiveFailures = authConfig.validation.maxConsecutiveFailures;
		this.healthCheckIntervalMs = authConfig.validation.healthCheckIntervalMs;

		// Start periodic health checks
		this.startHealthMonitoring();

		// Test connection on startup
		this.testConnection();
	}

	private async testConnection(): Promise<void> {
		try {
			// Simple query to test connection
			const { error } = await this.client
				.from("_health_check")
				.select("1")
				.limit(1)
				.single();

			if (error && error.code !== "PGRST116") {
				// PGRST116 = table not found, which is fine
				throw error;
			}

			this.updateHealth(true);
			Sentry.logger?.info?.("Supabase connection established successfully");
		} catch (error) {
			this.updateHealth(false);
			Sentry.logger?.error?.("Failed to connect to Supabase", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	private updateHealth(success: boolean): void {
		this.health.lastCheck = new Date();

		if (success) {
			this.health.healthy = true;
			this.health.consecutiveFailures = 0;
		} else {
			this.health.consecutiveFailures++;
			if (this.health.consecutiveFailures >= this.maxConsecutiveFailures) {
				this.health.healthy = false;
			}
		}
	}

	private startHealthMonitoring(): void {
		setInterval(async () => {
			try {
				await this.testConnection();
			} catch (error) {
				Sentry.logger?.warn?.("Supabase health check failed", {
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}, this.healthCheckIntervalMs);
	}

	/**
	 * Get the Supabase client instance
	 * Throws error if connection is unhealthy
	 */
	getClient(): SupabaseClient {
		if (!this.health.healthy) {
			throw new Error("Supabase connection is not healthy");
		}
		return this.client;
	}

	/**
	 * Validate JWT token and get user info
	 * Wraps auth.getUser() with error handling and logging
	 */
	async validateToken(token: string): Promise<{ user: any; error: any }> {
		if (!this.health.healthy) {
			throw new Error("Supabase connection is not healthy");
		}

		try {
			const { data, error } = await this.client.auth.getUser(token);

			if (error) {
				Sentry.logger?.debug?.("Token validation failed", {
					error: error.message,
					tokenPrefix: `${token.substring(0, 10)}...`,
				});
			} else {
				Sentry.logger?.debug?.("Token validation successful", {
					userId: data.user?.id,
				});
			}

			this.updateHealth(true);
			return { user: data.user, error };
		} catch (error) {
			this.updateHealth(false);
			Sentry.captureException(error, {
				tags: { service: "supabase", operation: "validateToken" },
			});
			throw new Error(
				`Supabase auth validation failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	getHealthStatus(): {
		healthy: boolean;
		lastCheck: Date;
		consecutiveFailures: number;
		maxFailures: number;
	} {
		return {
			healthy: this.health.healthy,
			lastCheck: this.health.lastCheck,
			consecutiveFailures: this.health.consecutiveFailures,
			maxFailures: this.maxConsecutiveFailures,
		};
	}

	async close(): Promise<void> {
		// Supabase client doesn't have explicit close method
		// Mark as unhealthy to prevent further use
		this.health.healthy = false;
		Sentry.logger?.info?.("Supabase connection closed");
	}
}

// Singleton instance
export const supabaseConnection = new SupabaseConnection();
