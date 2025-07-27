import crypto from "node:crypto";
import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { creditsService } from "@/services/creditsService.js";
import { databaseService } from "@/services/databaseService.js";
import { geminiService } from "@/services/geminiService.js";
import { topicService } from "@/services/topicService.js";

export const extractFacts = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const { id: interviewId } = req.params;
	const requestId = crypto.randomUUID();
	const startTime = Date.now();
	const userPrefix = req.user?.email?.split("@")[0] ?? "unknown";
	const userId = req.user?.id;

	if (!userId) {
		const serviceResponse = ServiceResponse.failure(
			"Invalid user authentication",
			null,
			StatusCodes.UNAUTHORIZED,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	if (!interviewId) {
		const serviceResponse = ServiceResponse.failure(
			"Interview ID is required",
			null,
			StatusCodes.BAD_REQUEST,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	// Check for concurrent operations
	if (await creditsService.checkUserLock(userId)) {
		const serviceResponse = ServiceResponse.failure(
			"Another operation is in progress, please wait and try again",
			null,
			StatusCodes.CONFLICT,
		);
		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}

	// Set user lock for entire workflow
	creditsService.setUserLock(userId);

	try {
		// Check available credits
		const currentCredits = await creditsService.getCurrentBalance(userId);
		if (currentCredits <= 0) {
			const serviceResponse = ServiceResponse.failure(
				"Not enough credits",
				null,
				StatusCodes.PAYMENT_REQUIRED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Log extraction workflow start
		Sentry.logger?.info?.("Interview extraction workflow started", {
			requestId,
			user_id: userId,
			user: userPrefix,
			interviewId,
		});

		// Step 1: Get interview and verify ownership
		const interview = await databaseService.getInterviewById(interviewId);
		if (!interview) {
			const serviceResponse = ServiceResponse.failure(
				"Interview not found",
				null,
				StatusCodes.NOT_FOUND,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		if (interview.user_id !== userId) {
			const serviceResponse = ServiceResponse.failure(
				"Access denied",
				null,
				StatusCodes.FORBIDDEN,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Step 2: Get all answers and build transcript
		const answers =
			await databaseService.getAnswersByInterviewIdBusiness(interviewId);
		const answeredQuestions = answers.filter(
			(a) => a.answer && a.answer.trim() !== "",
		);

		if (answeredQuestions.length === 0) {
			const serviceResponse = ServiceResponse.failure(
				"No answered questions found for extraction",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Build combined transcript for extraction
		const transcript = answeredQuestions
			.map(
				(answer) =>
					`<question number=${answer.question_number}>${answer.question}</question>\n<answer number=${answer.question_number}>${answer.answer}</answer>`,
			)
			.join("\n\n");

		// Step 3: Process AI extraction with existing logic
		const extractionResult = await geminiService.extractFacts(
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
					category: skill.category, // Will be enhanced in future iterations
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
		await databaseService.saveExperienceRecord(userId, { extractedFacts });

		// Step 6: Generate topic candidates and rerank (stub implementation)
		const existingTopics = await databaseService.getAvailableTopics(userId);
		const updatedTopics = await topicService.processTopicWorkflow(
			extractedFacts,
			userId,
			existingTopics,
		);

		// Step 7: Update interview status to completed
		await databaseService.updateInterviewStatus(
			parseInt(interviewId, 10),
			"completed",
		);

		// Step 8: Consume credits based on token usage
		const { remainingCredits } = await creditsService.consumeCredits(
			userId,
			totalTokenCount,
			"extractor",
		);

		const duration = Date.now() - startTime;

		// Log successful extraction workflow completion
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
				remainingCredits,
				newTopicsGenerated: updatedTopics.filter((t) =>
					t.id.startsWith("generated_"),
				).length,
			},
		);

		const serviceResponse = ServiceResponse.success(
			"Interview extraction completed successfully",
			{
				extractedFacts,
				credits: remainingCredits,
				interviewStatus: "completed",
				topicsUpdated: updatedTopics.length,
			},
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		const duration = Date.now() - startTime;
		// Already properly logged with Sentry.captureException above

		// Track extraction workflow error with full context
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
		// Supplementary logging for user journey analysis
		Sentry.logger?.error?.("Interview extraction workflow failed", {
			requestId,
			user_id: userId,
			user: userPrefix,
			interviewId,
			processingTime: duration,
			error: error instanceof Error ? error.message : String(error),
		});

		const serviceResponse = ServiceResponse.failure(
			`Failed to extract interview data: ${error instanceof Error ? error.message : "Unknown error"}`,
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} finally {
		// Always remove user lock
		creditsService.removeUserLock(userId);
	}
};
