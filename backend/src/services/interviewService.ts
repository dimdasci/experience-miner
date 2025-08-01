import * as Sentry from "@sentry/node";
import type { IGenerativeAIProvider } from "@/providers";
import {
	AnswerRepository,
	InterviewRepository,
	ExperienceRepository
} from "@/repositories";
import type { ModelResponse, MediaData } from "@/types/ai";
import type {
	Answer,
	Interview,
} from "@/types/domain";
import { ExtractedFactsSchema, type ExtractedFacts, type SourceRef } from "@/types/extractedFacts.js";
import {
	transcriptionSystemPrompt,
	transcriptionUserPrompt
} from "@/constants/interviewPrompts";
import { aiConfig } from "@/config";
import { extractionSystemPrompt, extractionUserPrompt } from "@/constants/interviewPrompts";
import { fillTemplate } from "@/services/utils.js";

/**
 * Service for interview-related business operations
 * Handles interview lifecycle, fact extraction, and transcription
 */
export class InterviewService {
	private aiProvider: IGenerativeAIProvider;
	private interviewRepo: InterviewRepository;
	private answerRepo: AnswerRepository;
	private experienceRepo: ExperienceRepository;

	constructor(
		aiProvider: IGenerativeAIProvider,
		interviewRepo: InterviewRepository,
		answerRepo: AnswerRepository,
		experienceRepo: ExperienceRepository
	) {
		this.aiProvider = aiProvider;
		this.interviewRepo = interviewRepo;
		this.answerRepo = answerRepo;
		this.experienceRepo = experienceRepo;
	}

	/**
	 * Update answer for a specific question
	 */
	async updateAnswer(
		interviewId: number,
		questionNumber: number,
		userId: string,
		answer: string,
		recordingDurationSeconds?: number,
	): Promise<Answer> {
		// Get answers for the interview
		const answers = await this.answerRepo.getByInterviewId(userId, interviewId)
		if (answers.length === 0) {
			throw new Error("No answers found for this interview");
		}

		// Get the specific answer by question number
		const targetAnswer = answers.find(
			(a) => a.question_number === questionNumber,
		);

		if (!targetAnswer) {
			throw new Error("Question not found");
		}

		// Update the answer
		return await this.answerRepo.update(
			userId,
			targetAnswer.id,
			answer,
			recordingDurationSeconds,
		);
	}

	/**
	 * Transcribe audio to text
	 */
	async transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
		userId: string,
	): Promise<ModelResponse<string>> {

		// // Check for concurrent operations
		// if (await this.creditsService.checkUserLock(userId)) {
		// 	throw new Error(
		// 		"Another operation is in progress, please wait and try again",
		// 	);
		// }

		// // Set user lock
		// this.creditsService.setUserLock(userId);
		const startTime = Date.now();

		Sentry.logger?.info?.("Audio transcription started", {
			user_id: userId,
			audioSize: audioBuffer.length,
			mimeType,
		});

		try {
			// Check available credits
			// const currentCredits =
			// 	await this.creditsService.getCurrentBalance(userId);
			// if (currentCredits <= 0) {
			// 	throw new Error("Not enough credits");
			// }

			const transcriptionResult = await this.aiProvider.generateCompletion(
				aiConfig.models.transcription,
				transcriptionSystemPrompt,
				transcriptionUserPrompt,
				{
					data: audioBuffer,
					mimeType,
				} as MediaData,
				0,
				aiConfig.maxTokens.transcription,
			)

			// Transcribe audio using AI provider
			// const transcriptionResult = await this.aiProvider.transcribeAudio(
			// 	audioBuffer,
			// 	mimeType,
			// );

			// const totalTokenCount =
			// 	transcriptionResult.usageMetadata?.totalTokenCount || 0;

			// Consume credits
			// await this.creditsService.consumeCredits(
			// 	userId,
			// 	totalTokenCount,
			// 	"transcriber",
			// );

			// Get remaining credits
			// const remainingCredits =
			// 	await this.creditsService.getCurrentBalance(userId);

			const duration = Date.now() - startTime;

			Sentry.logger?.info?.("Audio transcription completed successfully", {
				user_id: userId,
				transcriptLength: transcriptionResult.data?.length || 0,
				processingTime: duration,
				input_token: transcriptionResult.usage?.inputTokens || 0,
				output_token: transcriptionResult.usage?.outputTokens || 0,
			});

			return transcriptionResult;
		} catch (error) {
			const duration = Date.now() - startTime;

			Sentry.captureException(error, {
				tags: { endpoint: "transcribe", status: "error" },
				contexts: {
					request: {
						processingTime: duration,
					},
					user: { id: userId },
				},
			});

			Sentry.logger?.error?.("Audio transcription failed", {
				user_id: userId,
				processingTime: duration,
				audioSize: audioBuffer.length,
				mimeType,
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		} finally {
			// this.creditsService.removeUserLock(userId);
		}
	}

	async extractFacts(
		interviewId: number,
		userId: string,
	): Promise<ModelResponse<ExtractedFacts>> {

		// Retrieve interview data
		const interviewData = await this.interviewRepo.getById(userId, interviewId);
		if (!interviewData) {
			throw new Error("Interview not found or access denied");
		}
		const answers = await this.answerRepo.getByInterviewId(userId, interviewId);
		const answeredQuestions = answers.filter(
			(a) => a.answer && a.answer.trim().length > aiConfig.minAnswerLength,
		);
		if (answeredQuestions.length === 0) {
			throw new Error("No answered questions found for extraction");
		}
		// get previous facts if available
		const previousFactsRecord = await this.experienceRepo.getByUserId(userId);

		const previousFacts = previousFactsRecord && previousFactsRecord.payload ?
			this.buildFactsContext(previousFactsRecord.payload) : "We have no user career information yet.";

		const interviewContext = this.buildInterviewContext(interviewData, answeredQuestions);

		const prompt = fillTemplate(extractionUserPrompt, {
			careerContext: previousFacts,
			transcript: interviewContext,
		});

		Sentry.logger?.info?.("Fact extraction started", {
			user_id: userId,
			interviewId,
			answeredQuestionsCount: answeredQuestions.length,
		});

		const extractionResult = await this.aiProvider.generateCompletion(
			aiConfig.models.extraction,
			extractionSystemPrompt,
			prompt,
			undefined,
			0.1,
			aiConfig.maxTokens.extraction,
			ExtractedFactsSchema
		);

		return extractionResult;
	}
	private buildInterviewContext(interview: Interview, answers: Answer[]): string {
		const contextParts: string[] = [];

		contextParts.push(`<title>${interview.title}</title>`);
		contextParts.push(`<motivational_quote>${interview.motivational_quote}</motivational_quote>`);


		if (answers.length > 0) {
			contextParts.push("<answers>");
			for (const answer of answers) {
				if (!answer.answer || answer.answer.trim().length <= aiConfig.minAnswerLength) {
					continue; // Skip empty or short answers
				}
				contextParts.push(
					`<question number="${answer.question_number}">${answer.question}</question>`,
				);
				contextParts.push(
					`<answer>${answer.answer}</answer>`,
				);
			}
		} else {
			contextParts.push("No answers provided for this interview yet.");
		}

		return `<interview>\n${contextParts.join("\n\n")}\n</interview>`;
	}

	private buildFactsContext(extractedFacts: ExtractedFacts): string {
		if (!extractedFacts) return "";

		const parts: string[] = [];

		if (extractedFacts.companies?.length > 0) {
			parts.push('<companies>');
			parts.push(
				`${extractedFacts.companies.map((c) => `<company name="${c.name}">${this.addSource(c.sources)}</company>`).join("\n")}`,
			);
		}

		if (extractedFacts.roles?.length > 0) {
			parts.push('<roles>');
			parts.push(
				extractedFacts.roles
					.map((r) => `<role company="${r.company}" duration="${r.duration}">\n${this.addSource(r.sources)}\n<title>${r.title}</title>\n</role>`)
					.join("\n")
			);
			parts.push('</roles>');
		}

		if (extractedFacts.projects?.length > 0) {
			parts.push('<projects>')
			parts.push(
				extractedFacts.projects
					.map((p) => `<project name="${p.name}" role="${p.role}" company="${p.company}">\n${this.addSource(p.sources)}\n<description>${p.description}</description>\n</project>`)
					.join("\n")
			);
			parts.push('</projects>');
		}

		if (extractedFacts.skills?.length > 0) {
			parts.push('<skills>');
			parts.push(
				`${extractedFacts.skills.map((s) => `<skill name="${s.name}" category="${s.category}">\n${this.addSource(s.sources)}\n</skill>`).join("\n")}`,
			);
			parts.push('</skills>');
		}

		if (extractedFacts.achievements?.length > 0) {
			parts.push('<achievements>');
			parts.push(
				extractedFacts.achievements
					.map((a) => `<achievement>\n${this.addSource(a.sources)}\n<description>\n${a.description}\n</description>\n</achievement>`).join("\n")
			);
			parts.push('</achievements>');
		}

		return `<career_path>\n${parts.join("\n")}\n</career_path>`;
	}

	private addSource(sources: SourceRef[]): string {
		if (!sources || sources.length === 0) {
			return "";
		}

		const sourceElements = sources.map((s) => {
			return `<source interview_id="${s.interview_id}" question_number="${s.question_number}"/>`;
		});
		return `<sources>\n${sourceElements.join("\n")}\n</sources>`;
	}

	/**
	 * Extract structured facts from interview and complete full workflow
	 */
	// async extractFacts(
	// 	interviewId: string,
	// 	userId: string,
	// ): Promise<{
	// 	extractedFacts: ExtractedFacts;
	// 	credits: number;
	// 	interviewStatus: InterviewStatus;
	// 	topicsUpdated: number;
	// 	creditsConsumed: {
	// 		extraction: number;
	// 		topicGeneration: number;
	// 		topicReranking: number;
	// 		total: number;
	// 	};
	// }> {
	// 	const requestId = crypto.randomUUID();
	// 	const startTime = Date.now();
	// 	const userPrefix = userId.split("@")[0] ?? "unknown";

	// 	// Check for concurrent operations
	// 	if (await this.creditsService.checkUserLock(userId)) {
	// 		throw new Error(
	// 			"Another operation is in progress, please wait and try again",
	// 		);
	// 	}

	// 	// Set user lock for entire workflow
	// 	this.creditsService.setUserLock(userId);

	// 	try {
	// 		// Check available credits
	// 		const currentCredits =
	// 			await this.creditsService.getCurrentBalance(userId);
	// 		if (currentCredits <= 0) {
	// 			throw new Error("Not enough credits");
	// 		}

	// 		Sentry.logger?.info?.("Interview extraction workflow started", {
	// 			requestId,
	// 			user_id: userId,
	// 			user: userPrefix,
	// 			interviewId,
	// 		});

	// 		// Step 1: Get interview and verify ownership
	// 		const interviewData = await this.getInterviewById(interviewId, userId);
	// 		if (!interviewData) {
	// 			throw new Error("Interview not found or access denied");
	// 		}

	// 		// Step 2: Get all answers and build transcript
	// 		const answers = interviewData.answers;
	// 		const answeredQuestions = answers.filter(
	// 			(a) => a.answer && a.answer.trim() !== "",
	// 		);

	// 		if (answeredQuestions.length === 0) {
	// 			throw new Error("No answered questions found for extraction");
	// 		}

	// 		// Build combined transcript for extraction
	// 		const transcript = answeredQuestions
	// 			.map(
	// 				(answer) =>
	// 					`<question number=${answer.question_number}>${answer.question}</question>\n<answer number=${answer.question_number}>${answer.answer}</answer>`,
	// 			)
	// 			.join("\n\n");

	// 		// Step 3: Process AI extraction
	// 		const extractionResult = await this.transcribeService.extractFacts(
	// 			transcript,
	// 			parseInt(interviewId, 10),
	// 		);
	// 		const totalTokenCount =
	// 			extractionResult.usageMetadata?.totalTokenCount || 0;

	// 		// Step 4: Get the complete extracted facts from transcribeService (already enriched with metadata)
	// 		const extractedFacts = extractionResult.data;

	// 		// Step 5: Save/update professional summary in experience table
	// 		// Save the complete extracted facts
	// 		await this.experienceRepo.saveRecord(userId, extractedFacts);

	// 		// Step 6: Generate topic candidates and rerank with credit tracking
	// 		const existingTopics = await this.topicRepo.getAvailable(userId);
	// 		const topicWorkflowResult = await this.topicService.processTopicWorkflow(
	// 			extractedFacts,
	// 			userId,
	// 			existingTopics,
	// 		);

	// 		const {
	// 			topics: updatedTopics,
	// 			generationTokens,
	// 			rerankingTokens,
	// 		} = topicWorkflowResult.data;

	// 		// Step 6.1: Save new generated topics to database
	// 		const newTopics = updatedTopics.filter((t: Topic) => !t.id);
	// 		let savedNewTopics: Topic[] = [];
	// 		if (newTopics.length > 0) {
	// 			savedNewTopics = await this.topicRepo.saveGenerated(newTopics);
	// 		}

	// 		// Step 6.2: Update topic statuses in database
	// 		const existingTopicsToUpdate = updatedTopics.filter(
	// 			(topic: Topic) => topic.id !== undefined,
	// 		);
	// 		if (existingTopicsToUpdate.length > 0) {
	// 			const statusUpdates = existingTopicsToUpdate
	// 				.filter(
	// 					(topic: Topic): topic is Topic & { id: number } =>
	// 						topic.id !== undefined,
	// 				)
	// 				.map((topic: Topic & { id: number }) => ({
	// 					id: topic.id,
	// 					status: topic.status as "available" | "used" | "irrelevant",
	// 				}));
	// 			await this.topicRepo.updateStatuses(statusUpdates);
	// 		}

	// 		// Step 7: Update interview status to completed
	// 		await this.interviewRepo.updateStatus(
	// 			parseInt(interviewId, 10),
	// 			"completed",
	// 		);

	// 		// Step 8: Consume credits for extraction
	// 		await this.creditsService.consumeCredits(
	// 			userId,
	// 			totalTokenCount,
	// 			"extractor",
	// 		);

	// 		// Step 9: Consume credits for topic generation
	// 		if (generationTokens > 0) {
	// 			await this.creditsService.consumeCredits(
	// 				userId,
	// 				generationTokens,
	// 				"topic_generator",
	// 			);
	// 		}

	// 		// Step 10: Consume credits for topic reranking
	// 		if (rerankingTokens > 0) {
	// 			await this.creditsService.consumeCredits(
	// 				userId,
	// 				rerankingTokens,
	// 				"topic_ranker",
	// 			);
	// 		}

	// 		// Final remaining credits
	// 		const remainingCredits =
	// 			await this.creditsService.getCurrentBalance(userId);

	// 		const duration = Date.now() - startTime;

	// 		// Log successful completion
	// 		const factsCounts = {
	// 			companies: extractedFacts.companies.length,
	// 			roles: extractedFacts.roles.length,
	// 			projects: extractedFacts.projects.length,
	// 			achievements: extractedFacts.achievements.length,
	// 			skills: extractedFacts.skills.length,
	// 		};

	// 		Sentry.logger?.info?.(
	// 			"Interview extraction workflow completed successfully",
	// 			{
	// 				requestId,
	// 				user_id: userId,
	// 				user: userPrefix,
	// 				interviewId,
	// 				transcriptLength: transcript.length,
	// 				processingTime: duration,
	// 				extractedCounts: factsCounts,
	// 				totalFacts: Object.values(factsCounts).reduce(
	// 					(sum, count) => sum + count,
	// 					0,
	// 				),
	// 				totalTokenCount,
	// 				topicGenerationTokens: generationTokens,
	// 				topicRerankingTokens: rerankingTokens,
	// 				totalTopicTokens: generationTokens + rerankingTokens,
	// 				remainingCredits,
	// 				newTopicsGenerated: savedNewTopics.length,
	// 				topicsMarkedIrrelevant: updatedTopics.filter(
	// 					(t: Topic) => t.status === "irrelevant",
	// 				).length,
	// 			},
	// 		);

	// 		return {
	// 			extractedFacts,
	// 			credits: remainingCredits,
	// 			interviewStatus: "completed" as const,
	// 			topicsUpdated: updatedTopics.length,
	// 			creditsConsumed: {
	// 				extraction: totalTokenCount,
	// 				topicGeneration: generationTokens,
	// 				topicReranking: rerankingTokens,
	// 				total: totalTokenCount + generationTokens + rerankingTokens,
	// 			},
	// 		};
	// 	} catch (error) {
	// 		const duration = Date.now() - startTime;

	// 		Sentry.captureException(error, {
	// 			tags: { endpoint: "extract", status: "error" },
	// 			contexts: {
	// 				request: {
	// 					id: requestId,
	// 					interviewId,
	// 					processingTime: duration,
	// 				},
	// 				user: { id: userId, email_prefix: userPrefix },
	// 			},
	// 		});

	// 		Sentry.logger?.error?.("Interview extraction workflow failed", {
	// 			requestId,
	// 			user_id: userId,
	// 			user: userPrefix,
	// 			interviewId,
	// 			processingTime: duration,
	// 			error: error instanceof Error ? error.message : String(error),
	// 		});

	// 		throw error;
	// 	} finally {
	// 		this.creditsService.removeUserLock(userId);
	// 	}
	// }

}
