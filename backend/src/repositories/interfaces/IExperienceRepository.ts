import type {
	ExperienceRecord,
	ProfessionalSummary,
} from "@/types/database/index.js";

/**
 * Repository interface for experience/professional summary operations
 */
export interface IExperienceRepository {
	/**
	 * Save or update experience record for user
	 */
	saveRecord(
		userId: string,
		record: { extractedFacts: any },
	): Promise<ExperienceRecord>;

	/**
	 * Get experience record by user ID
	 */
	getByUserId(userId: string): Promise<ExperienceRecord | null>;

	/**
	 * Update professional summary
	 */
	updateSummary(
		userId: string,
		summary: ProfessionalSummary,
	): Promise<ExperienceRecord>;

	/**
	 * Delete experience record
	 */
	delete(userId: string): Promise<void>;
}
