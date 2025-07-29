import crypto from "node:crypto";
import * as Sentry from "@sentry/node";
import { ServiceContainer } from "@/container/serviceContainer.js";
import type { IAIProvider } from "@/interfaces/providers/index.js";
import {
	AnswerRepository,
	ExperienceRepository,
	InterviewRepository,
	TopicRepository,
} from "@/repositories/index.js";
import type {
	Answer,
	Interview,
	InterviewStatus,
	Topic,
} from "@/types/database/index.js";

/**
 * Service for interview-related business operations
 * Handles interview lifecycle, fact extraction, and transcription
 */
export class InterviewService {
	private aiProvider: IAIProvider;
	private topicRepo: TopicRepository;
	private interviewRepo: InterviewRepository;
	private answerRepo: AnswerRepository;
	private experienceRepo: ExperienceRepository;
	private creditsService: any;
	private topicService: any;
	private transcribeService: any;

	constructor(
		aiProvider?: IAIProvider,
		repositories?: {
			topicRepo?: TopicRepository;
			interviewRepo?: InterviewRepository;
			answerRepo?: AnswerRepository;
			experienceRepo?: ExperienceRepository;
		},
		container?: ServiceContainer,
	) {
		const serviceContainer = container || ServiceContainer.getInstance();

		this.aiProvider = aiProvider || serviceContainer.getAIProvider();

		// Initialize repositories (could be moved to container in future iteration)
		this.topicRepo = repositories?.topicRepo || new TopicRepository();
		this.interviewRepo =
			repositories?.interviewRepo || new InterviewRepository();
		this.answerRepo = repositories?.answerRepo || new AnswerRepository();
		this.experienceRepo =
			repositories?.experienceRepo || new ExperienceRepository();

		// Initialize services from container
		this.creditsService = serviceContainer.getCreditsService();
		this.topicService = serviceContainer.getTopicService();
		this.transcribeService = serviceContainer.getTranscribeService();
	}

	/**
	 * Get all interviews for a user
	 */
	async getAllInterviews(userId: string): Promise<Interview[]> {
		return await this.interviewRepo.getAllByUserId(userId);
	}

	/**
	 * Get interview by ID with answers and ownership verification
	 */
	async getInterviewById(
		interviewId: string,
		userId: string,
	): Promise<{
		interview: Interview;
		answers: Answer[];
	} | null> {
		const interview = await this.interviewRepo.getById(interviewId);

		if (!interview) {
			return null;
		}

		// Verify ownership
		if (interview.user_id !== userId) {
			throw new Error("Access denied");
		}

		// Get all answers for this interview
		const answers = await this.answerRepo.getByInterviewId(interviewId);

		return {
			interview,
			answers,
		};
	}

	/**
	 * Update answer for a specific question
	 */
	async updateAnswer(
		interviewId: string,
		questionNumber: number,
		userId: string,
		answer: string,
		recordingDurationSeconds?: number,
	): Promise<Answer> {
		// Verify interview ownership
		const interviewData = await this.getInterviewById(interviewId, userId);
		if (!interviewData) {
			throw new Error("Interview not found or access denied");
		}

		// Get the specific answer by question number
		const targetAnswer = interviewData.answers.find(
			(a) => a.question_number === questionNumber,
		);

		if (!targetAnswer) {
			throw new Error("Question not found");
		}

		// Update the answer
		return await this.answerRepo.update({
			answerId: targetAnswer.id,
			answer,
			recordingDurationSeconds,
		});
	}

	/**
	 * Transcribe audio to text
	 */
	async transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
		userId: string,
	): Promise<{
		transcript: string;
		credits: number;
		tokensUsed: number;
	}> {
		const requestId = crypto.randomUUID();
		const startTime = Date.now();
		const userPrefix = userId.split("@")[0] ?? "unknown";

		// Check for concurrent operations
		if (await this.creditsService.checkUserLock(userId)) {
			throw new Error(
				"Another operation is in progress, please wait and try again",
			);
		}

		// Set user lock
		this.creditsService.setUserLock(userId);

		try {
			// Check available credits
			const currentCredits = await this.creditsService.getCurrentBalance(userId);
			if (currentCredits <= 0) {
				throw new Error("Not enough credits");
			}

			Sentry.logger?.info?.("Audio transcription started", {
				requestId,
				user_id: userId,
				user: userPrefix,
				audioSize: audioBuffer.length,
				mimeType,
			});

			// Transcribe audio using AI provider
			const transcriptionResult = await this.aiProvider.transcribeAudio(
				audioBuffer,
				mimeType,
			);

			const totalTokenCount =
				transcriptionResult.usageMetadata?.totalTokenCount || 0;

			// Consume credits
			await this.creditsService.consumeCredits(
				userId,
				totalTokenCount,
				"transcriber",
			);

			// Get remaining credits
			const remainingCredits = await this.creditsService.getCurrentBalance(userId);

			const duration = Date.now() - startTime;

			Sentry.logger?.info?.("Audio transcription completed successfully", {
				requestId,
				user_id: userId,
				user: userPrefix,
				transcriptLength: transcriptionResult.data.length,
				processingTime: duration,
				totalTokenCount,
				remainingCredits,
			});

			return {
				transcript: transcriptionResult.data,
				credits: remainingCredits,
				tokensUsed: totalTokenCount,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			Sentry.captureException(error, {
				tags: { endpoint: "transcribe", status: "error" },
				contexts: {
					request: {
						id: requestId,
						processingTime: duration,
					},
					user: { id: userId, email_prefix: userPrefix },
				},
			});

			Sentry.logger?.error?.("Audio transcription failed", {
				requestId,
				user_id: userId,
				user: userPrefix,
				processingTime: duration,
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		} finally {
			this.creditsService.removeUserLock(userId);
		}
	}

	/**
	 * Extract structured facts from interview and complete full workflow
	 */
	async extractFacts(
		interviewId: string,
		userId: string,
	): Promise<{
		extractedFacts: any;
		credits: number;
		interviewStatus: InterviewStatus;
		topicsUpdated: number;
		creditsConsumed: {
			extraction: number;
			topicGeneration: number;
			topicReranking: number;
			total: number;
		};
	}> {
		const requestId = crypto.randomUUID();
		const startTime = Date.now();
		const userPrefix = userId.split("@")[0] ?? "unknown";

		// Check for concurrent operations
		if (await this.creditsService.checkUserLock(userId)) {
			throw new Error(
				"Another operation is in progress, please wait and try again",
			);
		}

		// Set user lock for entire workflow
		this.creditsService.setUserLock(userId);

		try {
			// Check available credits
			const currentCredits = await this.creditsService.getCurrentBalance(userId);
			if (currentCredits <= 0) {
				throw new Error("Not enough credits");
			}

			Sentry.logger?.info?.("Interview extraction workflow started", {
				requestId,
				user_id: userId,
				user: userPrefix,
				interviewId,
			});

			// Step 1: Get interview and verify ownership
			const interviewData = await this.getInterviewById(interviewId, userId);
			if (!interviewData) {
				throw new Error("Interview not found or access denied");
			}

			// Step 2: Get all answers and build transcript
			const answers = interviewData.answers;
			const answeredQuestions = answers.filter(
				(a) => a.answer && a.answer.trim() !== "",
			);

			if (answeredQuestions.length === 0) {
				throw new Error("No answered questions found for extraction");
			}

			// Build combined transcript for extraction
			const transcript = answeredQuestions
				.map(
					(answer) =>
						`<question number=${answer.question_number}>${answer.question}</question>\n<answer number=${answer.question_number}>${answer.answer}</answer>`,
				)
				.join("\n\n");

			// Step 3: Process AI extraction
			const extractionResult = await this.transcribeService.extractFacts(
				transcript,
				interviewId,
			);
			const totalTokenCount =
				extractionResult.usageMetadata?.totalTokenCount || 0;

			// Step 4: Transform extraction data to include source tracking
			const currentTimestamp = new Date().toISOString();
			const extractedFacts = {
				achievements: (extractionResult.data.achievements || []).map(
					(achievement: {
						description: string;
						sourceQuestionNumber: number;
					}) => ({
						description: achievement.description,
						sourceInterviewId: interviewId,
						sourceQuestionNumber: achievement.sourceQuestionNumber,
						extractedAt: currentTimestamp,
					}),
				),
				companies: (extractionResult.data.companies || []).map(
					(company: { name: string; sourceQuestionNumber: number }) => ({
						name: company.name,
						sourceInterviewId: interviewId,
						sourceQuestionNumber: company.sourceQuestionNumber,
						extractedAt: currentTimestamp,
					}),
				),
				projects: (extractionResult.data.projects || []).map(
					(project: {
						name: string;
						description: string;
						role: string;
						company?: string;
						sourceQuestionNumber: number;
					}) => ({
						name: project.name || "Unnamed Project",
						description: project.description || "",
						role: project.role || "",
						company: project.company || undefined,
						sourceInterviewId: interviewId,
						sourceQuestionNumber: project.sourceQuestionNumber,
						extractedAt: currentTimestamp,
					}),
				),
				roles: (extractionResult.data.roles || []).map(
					(role: {
						title: string;
						company: string;
						duration: string;
						sourceQuestionNumber: number;
					}) => ({
						title: role.title || "Unknown Role",
						company: role.company || "Unknown Company",
						duration: role.duration || "",
						sourceInterviewId: interviewId,
						sourceQuestionNumber: role.sourceQuestionNumber,
						extractedAt: currentTimestamp,
					}),
				),
				skills: (extractionResult.data.skills || []).map(
					(skill: {
						name: string;
						category?: string;
						sourceQuestionNumber: number;
					}) => ({
						name: skill.name,
						category: skill.category,
						sourceInterviewId: interviewId,
						sourceQuestionNumber: skill.sourceQuestionNumber,
						extractedAt: currentTimestamp,
					}),
				),
				summary: {
					text: extractionResult.data.summary || "",
					lastUpdated: currentTimestamp,
					basedOnInterviews: [interviewId],
				},
				metadata: {
					totalExtractions: 1,
					lastExtractionAt: currentTimestamp,
					creditsUsed: totalTokenCount,
				},
			};

			// Step 5: Save/update professional summary in experience table
			await this.experienceRepo.saveRecord(userId, { extractedFacts });

			// Step 6: Generate topic candidates and rerank with credit tracking
			const existingTopics = await this.topicRepo.getAvailable(userId);
			const topicWorkflowResult = await this.topicService.processTopicWorkflow(
				extractedFacts,
				userId,
				existingTopics,
			);

			const {
				topics: updatedTopics,
				generationTokens,
				rerankingTokens,
			} = topicWorkflowResult.data;

			// Step 6.1: Save new generated topics to database
			const newTopics = updatedTopics.filter((t) => !t.id);
			let savedNewTopics: Topic[] = [];
			if (newTopics.length > 0) {
				savedNewTopics = await this.topicRepo.saveGenerated(newTopics);
			}

			// Step 6.2: Update topic statuses in database
			const existingTopicsToUpdate = updatedTopics.filter(
				(topic) => topic.id !== undefined,
			);
			if (existingTopicsToUpdate.length > 0) {
				const statusUpdates = existingTopicsToUpdate
					.filter(
						(topic): topic is Topic & { id: number } => topic.id !== undefined,
					)
					.map((topic) => ({
						id: topic.id,
						status: topic.status as "available" | "used" | "irrelevant",
					}));
				await this.topicRepo.updateStatuses(statusUpdates);
			}

			// Step 7: Update interview status to completed
			await this.interviewRepo.updateStatus(
				parseInt(interviewId, 10),
				"completed",
			);

			// Step 8: Consume credits for extraction
			await this.creditsService.consumeCredits(userId, totalTokenCount, "extractor");

			// Step 9: Consume credits for topic generation
			if (generationTokens > 0) {
				await this.creditsService.consumeCredits(
					userId,
					generationTokens,
					"topic_generator",
				);
			}

			// Step 10: Consume credits for topic reranking
			if (rerankingTokens > 0) {
				await this.creditsService.consumeCredits(
					userId,
					rerankingTokens,
					"topic_ranker",
				);
			}

			// Final remaining credits
			const remainingCredits = await this.creditsService.getCurrentBalance(userId);

			const duration = Date.now() - startTime;

			// Log successful completion
			const factsCounts = {
				companies: extractedFacts.companies.length,
				roles: extractedFacts.roles.length,
				projects: extractedFacts.projects.length,
				achievements: extractedFacts.achievements.length,
				skills: extractedFacts.skills.length,
			};

			Sentry.logger?.info?.(
				"Interview extraction workflow completed successfully",
				{
					requestId,
					user_id: userId,
					user: userPrefix,
					interviewId,
					transcriptLength: transcript.length,
					processingTime: duration,
					extractedCounts: factsCounts,
					totalFacts: Object.values(factsCounts).reduce(
						(sum, count) => sum + count,
						0,
					),
					totalTokenCount,
					topicGenerationTokens: generationTokens,
					topicRerankingTokens: rerankingTokens,
					totalTopicTokens: generationTokens + rerankingTokens,
					remainingCredits,
					newTopicsGenerated: savedNewTopics.length,
					topicsMarkedIrrelevant: updatedTopics.filter(
						(t) => t.status === "irrelevant",
					).length,
				},
			);

			return {
				extractedFacts,
				credits: remainingCredits,
				interviewStatus: "completed",
				topicsUpdated: updatedTopics.length,
				creditsConsumed: {
					extraction: totalTokenCount,
					topicGeneration: generationTokens,
					topicReranking: rerankingTokens,
					total: totalTokenCount + generationTokens + rerankingTokens,
				},
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			Sentry.captureException(error, {
				tags: { endpoint: "extract", status: "error" },
				contexts: {
					request: {
						id: requestId,
						interviewId,
						processingTime: duration,
					},
					user: { id: userId, email_prefix: userPrefix },
				},
			});

			Sentry.logger?.error?.("Interview extraction workflow failed", {
				requestId,
				user_id: userId,
				user: userPrefix,
				interviewId,
				processingTime: duration,
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		} finally {
			this.creditsService.removeUserLock(userId);
		}
	}
}

// Lazy singleton instance to avoid initialization at module load time
let _interviewService: InterviewService | null = null;

export const getInterviewService = (): InterviewService => {
	if (!_interviewService) {
		_interviewService = new InterviewService();
	}
	return _interviewService;
};
