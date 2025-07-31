import * as Sentry from "@sentry/node";

// In-memory user processing locks to prevent concurrent operations
const userProcessingLocks = new Map<string, number>();

export class CreditsService {
	async checkUserLock(userId: string): Promise<boolean> {
		return userProcessingLocks.has(userId);
	}

	setUserLock(userId: string): void {
		userProcessingLocks.set(userId, Date.now());
		Sentry.logger?.info?.("User processing lock set", { user_id: userId });
	}

	removeUserLock(userId: string): void {
		const wasLocked = userProcessingLocks.delete(userId);
		if (wasLocked) {
			Sentry.logger?.info?.("User processing lock removed", { user_id: userId });
		}
	}
}
