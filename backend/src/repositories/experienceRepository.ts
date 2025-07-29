import * as Sentry from "@sentry/node";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type {
	ExperienceRecord,
	ProfessionalSummary,
} from "@/types/database/index.js";
import type { IExperienceRepository } from "./interfaces/index.js";

/**
 * PostgreSQL implementation of experience repository
 */
export class ExperienceRepository implements IExperienceRepository {
	private get db() {
		return ServiceContainer.getInstance().getDatabaseProvider();
	}

	async saveRecord(
		userId: string,
		record: { extractedFacts: any },
	): Promise<ExperienceRecord> {
		// Check if record exists
		const existing = await this.getByUserId(userId);

		if (existing) {
			// Update existing record
			const result = await this.db.query<ExperienceRecord>(
				`UPDATE experience 
				 SET summary = $1, updated_at = NOW() 
				 WHERE user_id = $2 
				 RETURNING *`,
				[JSON.stringify(record.extractedFacts), userId],
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
				summary: updatedRecord.summary as ProfessionalSummary,
				updated_at: updatedRecord.updated_at,
			};
		} else {
			// Create new record
			const result = await this.db.query<ExperienceRecord>(
				`INSERT INTO experience (user_id, summary, updated_at)
				 VALUES ($1, $2, NOW())
				 RETURNING *`,
				[userId, JSON.stringify(record.extractedFacts)],
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
				summary: newRecord.summary as ProfessionalSummary,
				updated_at: newRecord.updated_at,
			};
		}
	}

	async getByUserId(userId: string): Promise<ExperienceRecord | null> {
		const result = await this.db.query<{
			user_id: string;
			summary: any;
			updated_at: string;
		}>("SELECT * FROM experience WHERE user_id = $1", [userId]);

		if (result.length === 0) {
			return null;
		}

		const record = result[0];
		return {
			user_id: record.user_id,
			summary:
				typeof record.summary === "string"
					? JSON.parse(record.summary)
					: record.summary,
			updated_at: record.updated_at,
		};
	}

	async updateSummary(
		userId: string,
		summary: ProfessionalSummary,
	): Promise<ExperienceRecord> {
		const result = await this.db.query<{
			user_id: string;
			summary: any;
			updated_at: string;
		}>(
			`UPDATE experience 
			 SET summary = $1, updated_at = NOW() 
			 WHERE user_id = $2 
			 RETURNING *`,
			[JSON.stringify(summary), userId],
		);

		if (!result || result.length === 0) {
			throw new Error("Experience summary update failed - record not found");
		}

		const record = result[0];
		if (!record) {
			throw new Error("Experience summary update returned empty row");
		}

		Sentry.logger?.info?.("Professional summary updated", {
			userId,
			summaryUpdated: true,
		});

		return {
			user_id: record.user_id,
			summary:
				typeof record.summary === "string"
					? JSON.parse(record.summary)
					: record.summary,
			updated_at: record.updated_at,
		};
	}

	async delete(userId: string): Promise<void> {
		await this.db.query("DELETE FROM experience WHERE user_id = $1", [userId]);

		Sentry.logger?.info?.("Experience record deleted", {
			userId,
		});
	}
}
