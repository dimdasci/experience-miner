import type { ExperienceRecord } from "@/types/database/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts.js";

/**
 * Repository interface for experience/professional summary operations
 */
export interface IExperienceRepository {
	/**
	 * Save or update experience record for user
	 */
	saveRecord(userId: string, record: ExtractedFacts): Promise<ExperienceRecord>;

	/**
	 * Get experience record by user ID
	 */
	getByUserId(userId: string): Promise<ExperienceRecord | null>;

	/**
	 * Update experience record
	 */
	updateRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord>;

	/**
	 * Delete experience record
	 */
	deleteRecord(userId: string): Promise<void>;
}
