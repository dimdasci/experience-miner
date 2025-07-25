import type { PoolClient } from "pg";
import type {
	Answer as BusinessAnswer,
	CreateAnswerParams,
	CreateInterviewParams,
	CreateTopicParams,
	ExperienceRecord,
	Interview,
	InterviewStatus,
	ProfessionalSummary,
	Topic,
	UpdateAnswerParams,
} from "@/common/types/business.js";
import { database } from "@/common/utils/database.js";

export interface Answer {
	id: string;
	created_at: string;
	user_id: string;
	question: string;
	answer: string;
	recording_duration_sec?: number;
	finished_at?: string;
	interview_id: number;
}

class DatabaseService {
	async saveAnswer(
		userId: string,
		question: string,
		answer: string,
		interviewId: number,
		recordingDuration?: number,
	): Promise<Answer> {
		const result = await database.query<Answer>(
			`INSERT INTO answers (user_id, question, answer, interview_id, recording_duration_sec, finished_at)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 RETURNING *`,
			[
				userId,
				question,
				answer,
				interviewId,
				recordingDuration !== undefined ? recordingDuration : null,
			],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answerRecord = result[0];
		if (!answerRecord) {
			throw new Error("Answer insert returned empty row");
		}

		return answerRecord;
	}

	async saveAnswerWithTransaction(
		client: PoolClient,
		userId: string,
		question: string,
		answer: string,
		interviewId: number,
		recordingDuration?: number,
	): Promise<Answer> {
		const result = await client.query<Answer>(
			`INSERT INTO answers (user_id, question, answer, interview_id, recording_duration_sec, finished_at)
			 VALUES ($1, $2, $3, $4, $5, NOW())
			 RETURNING *`,
			[
				userId,
				question,
				answer,
				interviewId,
				recordingDuration !== undefined ? recordingDuration : null,
			],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const answerRecord = result.rows[0];
		if (!answerRecord) {
			throw new Error("Answer insert returned empty row");
		}

		return answerRecord;
	}

	async getAnswersByInterviewId(interviewId: number): Promise<Answer[]> {
		const result = await database.query<Answer>(
			"SELECT * FROM answers WHERE interview_id = $1 ORDER BY created_at ASC",
			[interviewId],
		);

		return result;
	}

	async getAnswersByUserId(userId: string): Promise<Answer[]> {
		const result = await database.query<Answer>(
			"SELECT * FROM answers WHERE user_id = $1 ORDER BY created_at DESC",
			[userId],
		);

		return result;
	}

	// New business logic methods

	// Topic CRUD operations
	async createTopic(params: CreateTopicParams): Promise<Topic> {
		const result = await database.query<Topic>(
			`INSERT INTO topics (user_id, title, motivational_quote, questions, status, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			 RETURNING *`,
			[
				params.userId,
				params.title,
				params.motivational_quote,
				JSON.stringify(params.questions),
				params.status,
			],
		);

		if (!result || result.length === 0) {
			throw new Error("Topic insert failed - no rows returned");
		}

		const topic = result[0];
		if (!topic) {
			throw new Error("Topic insert returned empty row");
		}

		return topic;
	}

	async getTopicsByUserId(userId: string): Promise<Topic[]> {
		const result = await database.query<Topic>(
			"SELECT * FROM topics WHERE user_id = $1 AND status = 'available' ORDER BY created_at ASC",
			[userId],
		);

		return result;
	}

	async getTopicById(topicId: string): Promise<Topic | null> {
		const result = await database.query<Topic>(
			"SELECT * FROM topics WHERE id = $1",
			[topicId],
		);

		if (result.length === 0) {
			return null;
		}
		const item = result[0];
		if (!item) {
			throw new Error("Database returned null row");
		}
		return item;
	}

	async markTopicAsUsed(topicId: string): Promise<Topic> {
		const result = await database.query<Topic>(
			`UPDATE topics 
			 SET status = 'used', updated_at = NOW()
			 WHERE id = $1
			 RETURNING *`,
			[topicId],
		);

		if (!result || result.length === 0) {
			throw new Error("Topic update failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	async markTopicAsUsedWithTransaction(
		client: PoolClient,
		topicId: string,
	): Promise<Topic> {
		const result = await client.query<Topic>(
			`UPDATE topics 
			 SET status = 'used', updated_at = NOW()
			 WHERE id = $1
			 RETURNING *`,
			[topicId],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Topic update failed - no rows returned");
		}

		const item = result.rows[0];
		if (!item) {
			throw new Error("Transaction operation failed - no row returned");
		}
		return item;
	}

	// Interview CRUD operations
	async createInterview(params: CreateInterviewParams): Promise<Interview> {
		const result = await database.query<Interview>(
			`INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`,
			[params.userId, params.title, params.motivational_quote],
		);

		if (!result || result.length === 0) {
			throw new Error("Interview insert failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	async createInterviewWithTransaction(
		client: PoolClient,
		params: CreateInterviewParams,
	): Promise<Interview> {
		const result = await client.query<Interview>(
			`INSERT INTO interviews (user_id, title, motivational_quote, status, created_at, updated_at)
			 VALUES ($1, $2, $3, 'draft', NOW(), NOW())
			 RETURNING *`,
			[params.userId, params.title, params.motivational_quote],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Interview insert failed - no rows returned");
		}

		const item = result.rows[0];
		if (!item) {
			throw new Error("Transaction operation failed - no row returned");
		}
		return item;
	}

	async getInterviewById(interviewId: string): Promise<Interview | null> {
		const result = await database.query<Interview>(
			"SELECT * FROM interviews WHERE id = $1",
			[interviewId],
		);

		if (result.length === 0) {
			return null;
		}
		const item = result[0];
		if (!item) {
			throw new Error("Database returned null row");
		}
		return item;
	}

	async updateInterviewStatus(
		interviewId: string,
		status: InterviewStatus,
	): Promise<Interview> {
		const result = await database.query<Interview>(
			`UPDATE interviews 
			 SET status = $2, updated_at = NOW()
			 WHERE id = $1
			 RETURNING *`,
			[interviewId, status],
		);

		if (!result || result.length === 0) {
			throw new Error("Interview update failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	// Answer CRUD operations (extended)
	async createAnswer(params: CreateAnswerParams): Promise<BusinessAnswer> {
		const result = await database.query<BusinessAnswer>(
			`INSERT INTO answers (interview_id, user_id, question_number, question, answer, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, '', NOW(), NOW())
			 RETURNING *`,
			[
				params.interviewId,
				params.userId,
				params.questionNumber,
				params.question,
			],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	async createAnswerWithTransaction(
		client: PoolClient,
		params: CreateAnswerParams,
	): Promise<BusinessAnswer> {
		const result = await client.query<BusinessAnswer>(
			`INSERT INTO answers (interview_id, user_id, question_number, question, answer, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, '', NOW(), NOW())
			 RETURNING *`,
			[
				params.interviewId,
				params.userId,
				params.questionNumber,
				params.question,
			],
		);

		if (!result.rows || result.rows.length === 0) {
			throw new Error("Answer insert failed - no rows returned");
		}

		const item = result.rows[0];
		if (!item) {
			throw new Error("Transaction operation failed - no row returned");
		}
		return item;
	}

	async updateAnswer(params: UpdateAnswerParams): Promise<BusinessAnswer> {
		const result = await database.query<BusinessAnswer>(
			`UPDATE answers 
			 SET answer = $2, recording_duration_seconds = $3, updated_at = NOW()
			 WHERE id = $1
			 RETURNING *`,
			[params.answerId, params.answer, params.recordingDurationSeconds || null],
		);

		if (!result || result.length === 0) {
			throw new Error("Answer update failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	async getAnswersByInterviewIdBusiness(
		interviewId: string,
	): Promise<BusinessAnswer[]> {
		const result = await database.query<BusinessAnswer>(
			"SELECT * FROM answers WHERE interview_id = $1 ORDER BY question_number ASC",
			[interviewId],
		);

		return result;
	}

	// Experience record operations
	async saveExperienceRecord(
		userId: string,
		summary: ProfessionalSummary,
	): Promise<ExperienceRecord> {
		const result = await database.query<ExperienceRecord>(
			`INSERT INTO experience_records (user_id, summary, updated_at)
			 VALUES ($1, $2, NOW())
			 ON CONFLICT (user_id) 
			 DO UPDATE SET summary = $2, updated_at = NOW()
			 RETURNING *`,
			[userId, JSON.stringify(summary)],
		);

		if (!result || result.length === 0) {
			throw new Error("Experience record upsert failed - no rows returned");
		}

		const item = result[0];
		if (!item) {
			throw new Error("Database operation failed - no row returned");
		}
		return item;
	}

	async getExperienceByUserId(
		userId: string,
	): Promise<ExperienceRecord | null> {
		const result = await database.query<ExperienceRecord>(
			"SELECT * FROM experience_records WHERE user_id = $1",
			[userId],
		);

		if (result.length === 0) {
			return null;
		}
		const item = result[0];
		if (!item) {
			throw new Error("Database returned null row");
		}
		return item;
	}

	async getCompletedInterviewsByUserId(userId: string): Promise<Interview[]> {
		const result = await database.query<Interview>(
			"SELECT * FROM interviews WHERE user_id = $1 AND status = 'completed' ORDER BY updated_at DESC",
			[userId],
		);

		return result;
	}
}

export const databaseService = new DatabaseService();
