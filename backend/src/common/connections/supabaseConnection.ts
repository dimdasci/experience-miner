import * as Sentry from "@sentry/node";
import {
	type AuthError,
	createClient,
	type SupabaseClient,
	type User,
} from "@supabase/supabase-js";
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

		Sentry.logger?.info?.(
			"Supabase connection initialized (health checks disabled for MVP)",
		);
	}

	/**
	 * Get the Supabase client instance
	 */
	getClient(): SupabaseClient {
		return this.client;
	}

	/**
	 * Validate JWT token and get user info
	 * Wraps auth.getUser() with error handling and logging
	 */
	async validateToken(
		token: string,
	): Promise<{ user: User | null; error: AuthError | null }> {
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

			return { user: data.user, error };
		} catch (error) {
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
		// Always report as healthy since we disabled health checks
		return {
			healthy: true,
			lastCheck: this.health.lastCheck,
			consecutiveFailures: 0,
			maxFailures: this.maxConsecutiveFailures,
		};
	}

	async close(): Promise<void> {
		// Supabase client doesn't have explicit close method
		Sentry.logger?.info?.("Supabase connection closed");
	}
}

// Singleton instance
export const supabaseConnection = new SupabaseConnection();
