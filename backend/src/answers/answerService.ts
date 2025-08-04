import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { type AppError, NotFoundError } from "@/errors";
import type { AnswerRepository } from "./answerRepository";
import type { Answer } from "./types";

/**
 * Service for answer-related business operations
 * Handles answer CRUD operations and business logic
 */
export class AnswerService {
	private answerRepo: AnswerRepository;

	constructor(answerRepo: AnswerRepository) {
		this.answerRepo = answerRepo;
	}

	/**
	 * Update answer for a specific question
	 */
	updateAnswer(
		interviewId: number,
		questionNumber: number,
		userId: string,
		answer: string,
		recordingDurationSeconds?: number,
	): TE.TaskEither<AppError, Answer> {
		return pipe(
			this.answerRepo.getByInterviewId(userId, interviewId),
			TE.flatMap((answers: Answer[]) => {
				if (answers.length === 0) {
					return TE.left(
						new NotFoundError("No answers found for this interview"),
					);
				}

				const targetAnswer = answers.find(
					(a) => a.question_number === questionNumber,
				);

				if (!targetAnswer) {
					return TE.left(new NotFoundError("Question not found"));
				}

				return this.answerRepo.update(
					userId,
					targetAnswer.id,
					answer,
					recordingDurationSeconds,
				);
			}),
		);
	}
}
