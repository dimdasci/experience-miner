import type * as TE from "fp-ts/lib/TaskEither";
import type { AppError } from "@/errors";
import type { DatabaseClient } from "@/providers";
import type { ExperienceRecord, ExtractedFacts } from "./types";

/**
 * Functional repository interface for experience/professional summary operations
 * Uses TaskEither for composable error handling
 */
export interface IExperienceRepository {
	/**
	 * Save or update experience record for user
	 */
	saveOrUpdateRecord(
		userId: string,
		record: ExtractedFacts,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, ExperienceRecord>;

	/**
	 * Get experience record by user ID
	 */
	getByUserId(
		userId: string,
		client?: DatabaseClient,
	): TE.TaskEither<AppError, ExperienceRecord>;

	/**
	 * Delete experience record
	 */
	deleteRecord(userId: string): TE.TaskEither<AppError, void>;
}
