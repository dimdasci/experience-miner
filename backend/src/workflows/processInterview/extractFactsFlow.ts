import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import type { Answer, AnswerRepository } from "@/answers";
import { aiConfig } from "@/config";
import {
	extractionSystemPrompt,
	extractionUserPrompt,
} from "@/constants/interviewPrompts";
import { type AppError, BadRequestError } from "@/errors";
import type { ExperienceRepository } from "@/experience";
import {
	type ExperienceRecord,
	type ExtractedFacts,
	ExtractedFactsSchema,
} from "@/experience/types";
import type { InterviewRepository } from "@/interviews";
import type { Interview } from "@/interviews/types";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import { fillTemplate } from "@/utils";
import { buildFactsContext, buildInterviewContext } from "./contextBuilder";

/**
 * Handles the fact extraction flow from interview data
 */
export class ExtractFactsFlow {
	private aiProvider: IGenerativeAIProvider;
	private interviewRepo: InterviewRepository;
	private answerRepo: AnswerRepository;
	private experienceRepo: ExperienceRepository;

	constructor(
		aiProvider: IGenerativeAIProvider,
		interviewRepo: InterviewRepository,
		answerRepo: AnswerRepository,
		experienceRepo: ExperienceRepository,
	) {
		this.aiProvider = aiProvider;
		this.interviewRepo = interviewRepo;
		this.answerRepo = answerRepo;
		this.experienceRepo = experienceRepo;
	}

	/**
	 * Extract facts from interview data
	 */
	execute(
		interviewId: number,
		userId: string,
	): TE.TaskEither<AppError, ModelResponse<ExtractedFacts>> {
		return pipe(
			// Get interview data and answers in parallel
			TE.Do,
			TE.bind(
				"interview",
				(): TE.TaskEither<AppError, Interview> =>
					this.interviewRepo.getById(userId, interviewId),
			),
			TE.bind(
				"answers",
				(): TE.TaskEither<AppError, Answer[]> =>
					this.answerRepo.getByInterviewId(userId, interviewId),
			),
			TE.bind(
				"previousFacts",
				(): TE.TaskEither<AppError, ExperienceRecord | null> =>
					pipe(
						this.experienceRepo.getByUserId(userId),
						TE.map((record): ExperienceRecord | null => record),
						TE.orElse((error) => {
							// If it's a NotFoundError, return null instead of failing
							if (error.errorCode === "NOT_FOUND") {
								return TE.right(null);
							}
							return TE.left(error);
						}),
					),
			),
			TE.flatMap(
				({
					interview,
					answers,
					previousFacts,
				}: {
					interview: Interview;
					answers: Answer[];
					previousFacts: ExperienceRecord | null;
				}) => {
					// Filter answered questions
					const answeredQuestions = answers.filter(
						(a) =>
							a.answer && a.answer.trim().length > aiConfig.minAnswerLength,
					);

					if (answeredQuestions.length === 0) {
						return TE.left(
							new BadRequestError("No answered questions found for extraction"),
						);
					}

					// Build context - previousFacts is ExperienceRecord | null
					const previousFactsContext = previousFacts?.payload
						? buildFactsContext(previousFacts.payload)
						: "We have no user career information yet.";

					const interviewContext = buildInterviewContext(
						interview,
						answeredQuestions,
					);

					const prompt = fillTemplate(extractionUserPrompt, {
						careerContext: previousFactsContext,
						transcript: interviewContext,
					});

					Sentry.logger?.info?.("Fact extraction started", {
						user_id: userId,
						interviewId,
						answeredQuestionsCount: answeredQuestions.length,
					});

					// Call AI provider directly (now functional)
					return this.aiProvider.generateCompletion(
						aiConfig.models.extraction,
						extractionSystemPrompt,
						prompt,
						undefined,
						0.1,
						aiConfig.maxTokens.extraction,
						ExtractedFactsSchema,
					);
				},
			),
		);
	}
}
