import type { PoolClient } from "pg";
import type {
	Answer,
	CreateAnswerParams,
	UpdateAnswerParams,
} from "@/types/database/index.js";
import type { IAnswerRepository } from "../interfaces/index.js";

/**
 * Mock implementation of answer repository for testing
 */
export class MockAnswerRepository implements IAnswerRepository {
	private answers: Answer[] = [];
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used in create method for ID generation
	private nextId = 1;

	/**
	 * Get current answers (for testing/debugging)
	 */
	getAll(): Answer[] {
		return [...this.answers];
	}

	/**
	 * Clear all answers (for test cleanup)
	 */
	clear(): void {
		this.answers = [];
		this.nextId = 1;
	}

	/**
	 * Set initial answers (for test setup)
	 */
	setAnswers(answers: Answer[]): void {
		this.answers = [...answers];
	}

	async create(params: CreateAnswerParams): Promise<Answer> {
		const answer: Answer = {
			id: `answer-${this.nextId++}`,
			interview_id: params.interviewId,
			user_id: params.userId,
			question_number: params.questionNumber,
			question: params.question,
			answer: null,
			recording_duration_seconds: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		this.answers.push(answer);
		return answer;
	}

	async createWithTransaction(
		_client: PoolClient,
		params: CreateAnswerParams,
	): Promise<Answer> {
		// For mock, transaction client is ignored
		return this.create(params);
	}

	async update(params: UpdateAnswerParams): Promise<Answer> {
		const answer = this.answers.find((a) => a.id === params.answerId);
		if (!answer) {
			throw new Error("Answer not found");
		}

		answer.answer = params.answer;
		answer.recording_duration_seconds = params.recordingDurationSeconds || null;
		answer.updated_at = new Date().toISOString();

		return answer;
	}

	async getByInterviewId(interviewId: string): Promise<Answer[]> {
		const id = parseInt(interviewId, 10);
		return this.answers
			.filter((answer) => answer.interview_id === id)
			.sort((a, b) => a.question_number - b.question_number);
	}

	async getById(answerId: string): Promise<Answer | null> {
		return this.answers.find((answer) => answer.id === answerId) || null;
	}

	async deleteByInterviewId(interviewId: number): Promise<void> {
		this.answers = this.answers.filter(
			(answer) => answer.interview_id !== interviewId,
		);
	}
}
