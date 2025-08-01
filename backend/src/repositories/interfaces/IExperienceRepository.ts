import type { ExperienceRecord } from "@/types/domain";
import type { ExtractedFacts } from "@/types/extractedFacts.js";

/**
 * Repository interface for experience/professional summary operations
 */
export interface IExperienceRepository {
	/**
	 * Save or update experience record for user
	 */
	saveOrUpdateRecord(userId: string, record: ExtractedFacts): Promise<ExperienceRecord>;

	/**
	 * Get experience record by user ID
	 */
	getByUserId(userId: string): Promise<ExperienceRecord | null>;

	/**
	 * Delete experience record
	 */
	deleteRecord(userId: string): Promise<void>;
}
