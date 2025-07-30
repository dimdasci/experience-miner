import * as Sentry from "@sentry/node";
import type { IDatabaseProvider } from "@/interfaces/providers/index.js";
import type { ExperienceRecord } from "@/types/database/index.js";
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

	async saveRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		// Check if record exists
		const existing = await this.getByUserId(userId);

		if (existing) {
			// Update existing record
			const result = await this.db.query<ExperienceRecord>(
				`UPDATE experience 
				 SET payload = $1, updated_at = NOW() 
				 WHERE user_id = $2 
				 RETURNING *`,
				[JSON.stringify(record), userId],
			);

			if (!result || result.length === 0) {
				throw new Error("Experience record update failed");
			}

			const updatedRecord = result[0];
			if (!updatedRecord) {
				throw new Error("Experience record update returned empty row");
			}

			Sentry.logger?.info?.("Experience record updated", {
				userId,
				recordUpdated: true,
			});

			return {
				user_id: updatedRecord.user_id,
				payload: updatedRecord.payload,
				updated_at: updatedRecord.updated_at,
			};
		} else {
			// Create new record
			const result = await this.db.query<ExperienceRecord>(
				`INSERT INTO experience (user_id, payload, updated_at)
				 VALUES ($1, $2, NOW())
				 RETURNING *`,
				[userId, JSON.stringify(record)],
			);

			if (!result || result.length === 0) {
				throw new Error("Experience record insert failed");
			}

			const newRecord = result[0];
			if (!newRecord) {
				throw new Error("Experience record insert returned empty row");
			}

			Sentry.logger?.info?.("Experience record created", {
				userId,
				recordCreated: true,
			});

			return {
				user_id: newRecord.user_id,
				payload: newRecord.payload,
				updated_at: newRecord.updated_at,
			};
		}
	}

	async getByUserId(userId: string): Promise<ExperienceRecord | null> {
		const result = await this.db.query<{
			user_id: string;
			payload: ExtractedFacts;
			updated_at: string;
		}>("SELECT * FROM experience WHERE user_id = $1", [userId]);

		if (result.length === 0) {
			return null;
		}

		const record = result[0];
		if (!record) {
			return null;
		}
		return {
			user_id: record.user_id,
			payload: record.payload,
			updated_at: record.updated_at,
		};
	}

	async updateRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		const result = await this.db.query<{
			user_id: string;
			payload: ExtractedFacts;
			updated_at: string;
		}>(
			`UPDATE experience 
			 SET payload = $1, updated_at = NOW() 
			 WHERE user_id = $2 
			 RETURNING *`,
			[JSON.stringify(record), userId],
		);

		if (!result || result.length === 0) {
			throw new Error("Experience record update failed - record not found");
		}

		const newRecord = result[0];
		if (!newRecord) {
			throw new Error("Experience record update returned empty row");
		}

		Sentry.logger?.info?.("Experience record updated", {
			userId,
			recordUpdated: true,
		});

		return {
			user_id: newRecord.user_id,
			payload: newRecord.payload,
			updated_at: newRecord.updated_at,
		};
	}

	async deleteRecord(userId: string): Promise<void> {
		await this.db.query("DELETE FROM experience WHERE user_id = $1", [userId]);
		Sentry.logger?.info?.("Experience record deleted", {
			userId,
		});
	}
}
