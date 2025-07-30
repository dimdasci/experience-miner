import type { ExperienceRecord } from "@/types/database/index.js";
import type { ExtractedFacts } from "@/types/extractedFacts.js";
import type { IExperienceRepository } from "../interfaces/index.js";

/**
 * Mock implementation of experience repository for testing
 */
export class MockExperienceRepository implements IExperienceRepository {
	private experiences: Map<string, ExperienceRecord> = new Map();

	/**
	 * Get all experiences (for testing/debugging)
	 */
	getAll(): ExperienceRecord[] {
		return Array.from(this.experiences.values());
	}

	/**
	 * Clear all experiences (for test cleanup)
	 */
	clear(): void {
		this.experiences.clear();
	}

	/**
	 * Set initial experiences (for test setup)
	 */
	setExperiences(experiences: ExperienceRecord[]): void {
		this.experiences.clear();
		for (const experience of experiences) {
			this.experiences.set(experience.user_id, experience);
		}
	}

	async saveRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		const experienceRecord: ExperienceRecord = {
			user_id: userId,
			payload: record,
			updated_at: new Date().toISOString(),
		};

		this.experiences.set(userId, experienceRecord);
		return experienceRecord;
	}

	async getByUserId(userId: string): Promise<ExperienceRecord | null> {
		return this.experiences.get(userId) || null;
	}

	async updateRecord(
		userId: string,
		record: ExtractedFacts,
	): Promise<ExperienceRecord> {
		const existing = this.experiences.get(userId);
		if (!existing) {
			throw new Error("Experience record not found");
		}

		const updated: ExperienceRecord = {
			...existing,
			payload: record,
			updated_at: new Date().toISOString(),
		};

		this.experiences.set(userId, updated);
		return updated;
	}

	async deleteRecord(userId: string): Promise<void> {
		this.experiences.delete(userId);
	}
}
