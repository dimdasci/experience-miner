import type { PoolClient } from "pg";
import type {
	CreateInterviewParams,
	Interview,
	InterviewStatus,
} from "@/types/database/index.js";
import type { IInterviewRepository } from "../interfaces/index.js";

/**
 * Mock implementation of interview repository for testing
 */
export class MockInterviewRepository implements IInterviewRepository {
	private interviews: Interview[] = [];
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used in create method for ID generation
	private nextId = 1;

	/**
	 * Get current interviews (for testing/debugging)
	 */
	getAll(): Interview[] {
		return [...this.interviews];
	}

	/**
	 * Clear all interviews (for test cleanup)
	 */
	clear(): void {
		this.interviews = [];
		this.nextId = 1;
	}

	/**
	 * Set initial interviews (for test setup)
	 */
	setInterviews(interviews: Interview[]): void {
		this.interviews = interviews.map((interview) => ({
			...interview,
			id: interview.id || this.nextId++,
		}));
	}

	async create(params: CreateInterviewParams): Promise<Interview> {
		const interview: Interview = {
			id: this.nextId++,
			user_id: params.userId,
			title: params.title,
			motivational_quote: params.motivational_quote,
			status: "draft",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		this.interviews.push(interview);
		return interview;
	}

	async createWithTransaction(
		_client: PoolClient,
		params: CreateInterviewParams,
	): Promise<Interview> {
		// For mock, transaction client is ignored
		return this.create(params);
	}

	async getById(interviewId: string): Promise<Interview | null> {
		const id = parseInt(interviewId, 10);
		return this.interviews.find((interview) => interview.id === id) || null;
	}

	async getAllByUserId(userId: string): Promise<Interview[]> {
		return this.interviews
			.filter((interview) => interview.user_id === userId)
			.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
			);
	}

	async updateStatus(
		interviewId: number,
		status: InterviewStatus,
	): Promise<Interview> {
		const interview = this.interviews.find((i) => i.id === interviewId);
		if (!interview) {
			throw new Error("Interview not found");
		}

		interview.status = status;
		interview.updated_at = new Date().toISOString();
		return interview;
	}

	async delete(interviewId: number): Promise<void> {
		const index = this.interviews.findIndex((i) => i.id === interviewId);
		if (index !== -1) {
			this.interviews.splice(index, 1);
		}
	}
}
