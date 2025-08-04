import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { INITIAL_TOPICS } from "@/constants/initialTopics.js";
import type { AppError } from "@/errors";
import type { TopicRepository } from "./topicRepository.js";
import type { Topic } from "./types.js";

/**
 * Service for topic generation and management operations
 * Uses AI provider for topic generation and ranking logic
 */
export class TopicService {
	private topicRepository: TopicRepository;

	constructor(topicRepository: TopicRepository) {
		this.topicRepository = topicRepository;
	}

	/**
	 * Get topics for user, seeding with initial topics if none exist
	 * @param userId - User ID to get topics for
	 * @returns Array of available topics with question counts
	 */
	getOrSeedTopics(userId: string): TE.TaskEither<AppError, Topic[]> {
		return pipe(
			// Get existing topics for user
			this.topicRepository.getByUserId(userId, "available"),
			TE.flatMap((topics: Topic[]) => {
				// If no topics exist, seed with initial topics
				if (topics.length === 0) {
					Sentry.logger?.info?.("Seeding initial topics for new user", {
						user_id: userId,
						topic_count: INITIAL_TOPICS.length,
					});

					// Create all initial topics using functional composition
					const seedingTasks = INITIAL_TOPICS.map((initialTopic) =>
						this.topicRepository.create(
							userId,
							initialTopic.title,
							initialTopic.motivational_quote,
							initialTopic.questions,
							"available",
						),
					);

					return TE.sequenceArray(seedingTasks);
				}
				return TE.right(topics);
			}),
			TE.map((topics: readonly Topic[]) => {
				// Add question count to response
				return [...topics].map((topic) => ({
					...topic,
					questionCount: Array.isArray(topic.questions)
						? topic.questions.length
						: 0,
				}));
			}),
		);
	}
}
