import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { Answer, IAnswerRepository } from "@/answers";
import { type AppError, BadRequestError, NotFoundError } from "@/errors";
import type { IInterviewRepository, Interview } from "@/interviews";
import type { DatabaseClient, IDatabaseProvider } from "@/providers";
import type { ITopicRepository, Topic } from "@/topics";

export class SelectTopicWorkflow {
	private topicRepository: ITopicRepository;
	private interviewRepository: IInterviewRepository;
	private answerRepository: IAnswerRepository;
	private databaseProvider: IDatabaseProvider;

	constructor(
		topicRepository: ITopicRepository,
		interviewRepository: IInterviewRepository,
		answerRepository: IAnswerRepository,
		databaseProvider: IDatabaseProvider,
	) {
		this.topicRepository = topicRepository;
		this.interviewRepository = interviewRepository;
		this.answerRepository = answerRepository;
		this.databaseProvider = databaseProvider;
	}

	execute(
		userId: string,
		topicId: number,
	): TE.TaskEither<AppError, { interview: Interview; answers: Answer[] }> {
		return pipe(
			// 1. Verify topic exists and is available
			this.topicRepository.getById(userId, topicId),
			TE.flatMap((topic: Topic | null) => {
				if (!topic) {
					return TE.left(new NotFoundError("Topic not found"));
				}
				if (topic.status !== "available") {
					return TE.left(new BadRequestError("Topic is not available"));
				}
				return TE.right(topic);
			}),
			// 2. Execute transaction to ensure atomicity
			TE.flatMap((topic: Topic) =>
				this.databaseProvider.transaction((client: DatabaseClient) =>
					pipe(
						// Mark topic as used
						this.topicRepository.markAsUsed(userId, topicId, client),
						TE.flatMap(() =>
							// Create interview
							this.interviewRepository.create(
								userId,
								topic.title,
								topic.overview,
								client,
							),
						),
						TE.flatMap((interview: Interview) =>
							// Create answer records
							this.createAnswers(interview, topic, userId, client),
						),
					),
				),
			),
		);
	}

	private createAnswers(
		interview: Interview,
		topic: Topic,
		userId: string,
		client: DatabaseClient,
	): TE.TaskEither<AppError, { interview: Interview; answers: Answer[] }> {
		const questions = Array.isArray(topic.questions) ? topic.questions : [];

		if (questions.length === 0) {
			return TE.right({ interview, answers: [] });
		}

		// Create all answers sequentially to maintain order
		const createAnswerTasks = questions.map((question) =>
			this.answerRepository.create(
				interview.id,
				userId,
				question.order,
				question.text,
				client,
			),
		);

		// Use sequenceArray to execute all tasks and collect results
		return pipe(
			TE.sequenceArray(createAnswerTasks),
			TE.map((answers: readonly Answer[]) => ({
				interview,
				answers: [...answers],
			})),
		);
	}
}
