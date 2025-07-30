import * as Sentry from "@sentry/node";
import type { IExperienceRepository } from "@/repositories/interfaces/IExperienceRepository";
import type { ExperienceRecord } from "@/types/database/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts";

export class ExperienceService {
	private experienceRepository: IExperienceRepository;

	constructor(experienceRepository: IExperienceRepository) {
		this.experienceRepository = experienceRepository;
	}

	async saveExperienceRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		try {
			Sentry.logger?.info?.("Saving experience record", {
				component: "ExperienceService",
				user_id: userId,
				operation: "saveExperienceRecord",
				extractionCount: record?.metadata?.totalExtractions || 0,
			});
			const result = await this.experienceRepository.saveRecord(userId, record);
			Sentry.logger?.info?.("Experience record saved successfully", {
				user_id: userId,
				operation: "saveExperienceRecord",
			});
			return result;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "experience", operation: "save_experience_record" },
				contexts: {
					user: { id: userId },
					operation: {
						name: "saveExperienceRecord",
						component: "ExperienceService",
					},
				},
			});
			Sentry.logger?.error?.("Experience record save failed", {
				user_id: userId,
				operation: "saveExperienceRecord",
				component: "ExperienceService",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async getExperienceByUserId(
		userId: string,
	): Promise<ExperienceRecord | null> {
		try {
			Sentry.logger?.debug?.("Querying experience table", {
				user_id: userId,
				operation: "getExperienceByUserId",
				component: "ExperienceService",
			});
			const result = await this.experienceRepository.getByUserId(userId);
			Sentry.logger?.debug?.("Experience query completed", {
				user_id: userId,
				rowCount: result ? 1 : 0,
				component: "ExperienceService",
			});
			return result;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { service: "experience", operation: "get_experience_by_user" },
				contexts: {
					user: { id: userId },
					operation: {
						name: "getExperienceByUserId",
						component: "ExperienceService",
					},
				},
			});
			Sentry.logger?.error?.("Experience query failed", {
				user_id: userId,
				operation: "getExperienceByUserId",
				component: "ExperienceService",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async updateExperienceRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		return this.experienceRepository.updateRecord(userId, record);
	}

	async deleteExperienceRecord(userId: string): Promise<void> {
		return this.experienceRepository.deleteRecord(userId);
	}
}
