import * as Sentry from "@sentry/node";
import type { DatabaseClient, IDatabaseProvider } from "@/providers/index.js";
import type { ExperienceRecord } from "@/types/domain/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts.js";
import type { IExperienceRepository } from "./interfaces/index.js";

/**
 * PostgreSQL implementation of experience repository
 */
export class ExperienceRepository implements IExperienceRepository {
	private db: IDatabaseProvider;

	constructor(databaseProvider: IDatabaseProvider) {
		this.db = databaseProvider;
	}

	async saveOrUpdateRecord(
		userId: string,
		record: ExtractedFacts,
		client?: DatabaseClient,
	): Promise<ExperienceRecord> {
		// Check if record exists
		const db = client || (await this.db.getClient());

		// pass client if provided
		const existing = await this.getByUserId(userId, client);

		if (existing) {
			// Update existing record
			const result = await db.query<ExperienceRecord>(
				`UPDATE experience 
				 SET payload = $1, updated_at = NOW() 
				 WHERE user_id = $2 
				 RETURNING *`,
				[JSON.stringify(record), userId],
			);

			const updatedRecord = this.db.getFirstRowOrThrow(result, "Experience record update failed");

			Sentry.logger?.info?.("Experience record updated", {
				userId,
				recordUpdated: true,
			});

			return updatedRecord;
		} else {
			// Create new record
			const result = await db.query<ExperienceRecord>(
				`INSERT INTO experience (user_id, payload, updated_at)
				 VALUES ($1, $2, NOW())
				 RETURNING *`,
				[userId, JSON.stringify(record)],
			);

			const newRecord = this.db.getFirstRowOrThrow(result, "Experience record insert failed");

			Sentry.logger?.info?.("Experience record created", {
				userId,
				recordCreated: true,
			});

			return newRecord;
		}
	}

	async getByUserId(userId: string, client?: DatabaseClient): Promise<ExperienceRecord | null> {
		const db = client || (await this.db.getClient());
		const result = await db.query<ExperienceRecord>(
			"SELECT * FROM experience WHERE user_id = $1", 
			[userId]
		);

		if (result.rows.length === 0) {
			return null;
		}

		const record = result.rows[0];
		if (!record) {
			return null;
		}
		return record;
	}

	async deleteRecord(userId: string): Promise<void> {
		await this.db.query("DELETE FROM experience WHERE user_id = $1", [userId]);
		Sentry.logger?.info?.("Experience record deleted", {
			userId,
		});
	}
}
