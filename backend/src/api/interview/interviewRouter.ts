import crypto from "node:crypto";
import * as Sentry from "@sentry/node";
import type { IRouter, Response } from "express";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import {
	type AuthenticatedRequest,
	authenticateToken,
} from "@/common/middleware/auth.js";
import { logger } from "@/common/middleware/requestLogger.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { creditsService } from "@/services/creditsService.js";
import { databaseService } from "@/services/databaseService.js";
import { geminiService } from "@/services/geminiService.js";

export const interviewRouter: IRouter = Router();

// Get all interviews for the authenticated user
interviewRouter.get(
	"/",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.id;

		if (!userId) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid user authentication",
				null,
				StatusCodes.UNAUTHORIZED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		try {
			const interviews = await databaseService.getAllInterviewsByUserId(userId);

			const serviceResponse = ServiceResponse.success(
				"Interviews retrieved successfully",
				interviews,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			console.error("Error in GET /api/interview:", error);

			const serviceResponse = ServiceResponse.failure(
				`Failed to get interviews: ${error instanceof Error ? error.message : "Unknown error"}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);

// Get interview by ID with all answers
interviewRouter.get(
	"/:id",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const { id: interviewId } = req.params;
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

		try {
			// Get interview details
			const interview = await databaseService.getInterviewById(interviewId);

			if (!interview) {
				const serviceResponse = ServiceResponse.failure(
					"Interview not found",
					null,
					StatusCodes.NOT_FOUND,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Verify user owns this interview
			if (interview.user_id !== userId) {
				const serviceResponse = ServiceResponse.failure(
					"Access denied",
					null,
					StatusCodes.FORBIDDEN,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Get all answers for this interview
			const answers =
				await databaseService.getAnswersByInterviewIdBusiness(interviewId);

			const serviceResponse = ServiceResponse.success(
				"Interview retrieved successfully",
				{
					interview,
					answers,
				},
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			console.error("Error in GET /api/interview/:id:", error);

			const serviceResponse = ServiceResponse.failure(
				`Failed to get interview: ${error instanceof Error ? error.message : "Unknown error"}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);

// Update answer by question number
interviewRouter.put(
	"/:id/answers/:questionNumber",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const { id: interviewId, questionNumber } = req.params;
		const { answer, recording_duration_seconds } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid user authentication",
				null,
				StatusCodes.UNAUTHORIZED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		if (!interviewId || !questionNumber) {
			const serviceResponse = ServiceResponse.failure(
				"Interview ID and question number are required",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		if (answer === undefined || answer === null) {
			const serviceResponse = ServiceResponse.failure(
				"Answer is required",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		try {
			// Verify interview exists and user owns it
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

			const questionNum = parseInt(questionNumber, 10);
			if (Number.isNaN(questionNum)) {
				const serviceResponse = ServiceResponse.failure(
					"Invalid question number",
					null,
					StatusCodes.BAD_REQUEST,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Update the answer
			const updatedAnswer = await databaseService.updateAnswerByQuestionNumber(
				parseInt(interviewId, 10),
				questionNum,
				answer,
				recording_duration_seconds,
			);

			const serviceResponse = ServiceResponse.success(
				"Answer updated successfully",
				updatedAnswer,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			console.error(
				"Error in PUT /api/interview/:id/answers/:questionNumber:",
				error,
			);

			const serviceResponse = ServiceResponse.failure(
				`Failed to update answer: ${error instanceof Error ? error.message : "Unknown error"}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);

// Configure multer for audio file uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

// Transcribe audio to text
interviewRouter.post(
	"/transcribe",
	authenticateToken,
	upload.single("audio"),
	async (req: AuthenticatedRequest, res: Response) => {
		const requestId = crypto.randomUUID();
		const startTime = Date.now();
		const userPrefix = req.user?.email?.split("@")[0] ?? "unknown";
		const userId = req.user?.id;

		const { question, interviewId, recordingDuration, questionNumber } = req.body;

		logger.debug("Transcribe endpoint called", {
			requestId,
			userId,
			hasFile: !!req.file,
			bodyKeys: Object.keys(req.body),
			question: question ? "present" : "missing",
			interviewId,
			recordingDuration,
			questionNumber,
		});

		if (!userId) {
			const serviceResponse = ServiceResponse.failure(
				"Invalid user authentication",
				null,
				StatusCodes.UNAUTHORIZED,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		if (!question || !interviewId || questionNumber === undefined) {
			const serviceResponse = ServiceResponse.failure(
				"Question, interviewId, and questionNumber are required",
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

		// Set user lock
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

			// Log transcription request
			Sentry.logger?.info?.("Transcription request started", {
				requestId,
				user_id: userId,
				user: userPrefix,
				fileSize: req.file?.size,
				mimeType: req.file?.mimetype,
				hasFile: !!req.file,
				question,
				interviewId,
			});

			if (!req.file) {
				// Log warning (structured logs if available, fallback to issues)
				if (Sentry.logger?.warn) {
					Sentry.logger.warn("Transcription failed - no file", {
						requestId,
						user_id: userId,
						user: userPrefix,
					});
				} else {
					Sentry.captureMessage(
						"Transcription failed - no audio file provided",
						{
							level: "warning",
							tags: { endpoint: "transcribe", error: "no_file" },
							contexts: {
								request: { id: requestId },
								user: { id: userId, email_prefix: userPrefix },
							},
						},
					);
				}

				const serviceResponse = ServiceResponse.failure(
					"No audio file provided",
					null,
					StatusCodes.BAD_REQUEST,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Process AI transcription
			const transcriptResult = await geminiService.transcribeAudio(
				req.file.buffer,
				req.file.mimetype,
			);

			const totalTokenCount =
				transcriptResult.usageMetadata?.totalTokenCount || 0;

			// Save to database with retry logic
			await creditsService.retryOperation(async () => {
				let parsedDuration: number | undefined;
				if (recordingDuration) {
					try {
						parsedDuration = parseInt(recordingDuration, 10);
					} catch (error) {
						logger.warn("Failed to parse recording duration", {
							error,
							recordingDuration,
						});
					}
				}

				await databaseService.updateAnswerByQuestionNumber(
					parseInt(interviewId, 10),
					parseInt(questionNumber, 10),
					transcriptResult.data,
					parsedDuration,
				);
			});

			// Consume credits based on token usage
			logger.debug("About to consume credits", {
				userId,
				totalTokenCount,
				sourceType: "transcriber",
			});

			const { remainingCredits } = await creditsService.consumeCredits(
				userId,
				totalTokenCount,
				"transcriber",
			);

			logger.debug("Credits consumed successfully", { remainingCredits });

			const duration = Date.now() - startTime;

			// Log successful transcription with token usage
			Sentry.logger?.info?.("Transcription completed successfully", {
				requestId,
				user_id: userId,
				user: userPrefix,
				fileSize: req.file.size,
				transcriptLength: transcriptResult.data.length,
				processingTime: duration,
				mimeType: req.file.mimetype,
				totalTokenCount,
				promptTokenCount: transcriptResult.usageMetadata?.promptTokenCount,
				candidatesTokenCount:
					transcriptResult.usageMetadata?.candidatesTokenCount,
				cachedContentTokenCount:
					transcriptResult.usageMetadata?.cachedContentTokenCount,
				remainingCredits,
			});

			const serviceResponse = ServiceResponse.success(
				"Audio transcribed successfully",
				{
					transcript: transcriptResult.data,
					credits: remainingCredits,
				},
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error("Error in /api/interview/transcribe:", error);
			console.error(
				"Error stack:",
				error instanceof Error ? error.stack : "No stack trace",
			);

			// Log transcription error
			if (Sentry.logger?.error) {
				Sentry.logger.error("Transcription failed", {
					requestId,
					user_id: userId,
					user: userPrefix,
					fileSize: req.file?.size,
					processingTime: duration,
					error: error instanceof Error ? error.message : String(error),
					errorStack: error instanceof Error ? error.stack : "No stack trace",
				});
			} else {
				Sentry.captureException(error, {
					tags: { endpoint: "transcribe", status: "error" },
					contexts: {
						request: {
							id: requestId,
							fileSize: req.file?.size,
							processingTime: duration,
						},
						user: { id: userId, email_prefix: userPrefix },
					},
				});
			}

			const serviceResponse = ServiceResponse.failure(
				`Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} finally {
			// Always remove user lock
			creditsService.removeUserLock(userId);
		}
	},
);

// Extract structured facts from transcript
interviewRouter.post(
	"/extract",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const { transcript, question, interviewId } = req.body;
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

		if (!question || !interviewId) {
			const serviceResponse = ServiceResponse.failure(
				"Question and interviewId are required",
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

		// Set user lock
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

			// Log extraction request
			Sentry.logger?.info?.("Facts extraction request started", {
				requestId,
				user_id: userId,
				user: userPrefix,
				transcriptLength: transcript?.length || 0,
				hasTranscript: !!transcript,
				question,
				interviewId,
			});

			if (!transcript || typeof transcript !== "string") {
				// Log warning (structured logs if available, fallback to issues)
				if (Sentry.logger?.warn) {
					Sentry.logger.warn("Facts extraction failed - invalid transcript", {
						requestId,
						user_id: userId,
						user: userPrefix,
						transcriptType: typeof transcript,
					});
				} else {
					Sentry.captureMessage(
						"Facts extraction failed - no transcript provided",
						{
							level: "warning",
							tags: { endpoint: "extract", error: "no_transcript" },
							contexts: {
								request: {
									id: requestId,
									transcriptType: typeof transcript,
								},
								user: { id: userId, email_prefix: userPrefix },
							},
						},
					);
				}

				const serviceResponse = ServiceResponse.failure(
					"No transcript provided or invalid format",
					null,
					StatusCodes.BAD_REQUEST,
				);
				return res.status(serviceResponse.statusCode).json(serviceResponse);
			}

			// Process AI extraction
			const extractionResult = await geminiService.extractFacts(transcript);
			const totalTokenCount =
				extractionResult.usageMetadata?.totalTokenCount || 0;

			// Note: Extract endpoint processes existing answers, doesn't create new ones

			// Consume credits based on token usage
			const { remainingCredits } = await creditsService.consumeCredits(
				userId,
				totalTokenCount,
				"extractor",
			);

			const duration = Date.now() - startTime;

			// Log successful extraction with detailed metrics
			const factsCounts = {
				companies: extractionResult.data.companies?.length || 0,
				roles: extractionResult.data.roles?.length || 0,
				projects: extractionResult.data.projects?.length || 0,
				achievements: extractionResult.data.achievements?.length || 0,
				skills: extractionResult.data.skills?.length || 0,
			};

			Sentry.logger?.info?.("Facts extraction completed successfully", {
				requestId,
				user_id: userId,
				user: userPrefix,
				transcriptLength: transcript.length,
				processingTime: duration,
				extractedCounts: factsCounts,
				totalFacts: Object.values(factsCounts).reduce(
					(sum, count) => sum + count,
					0,
				),
				totalTokenCount,
				promptTokenCount: extractionResult.usageMetadata?.promptTokenCount,
				candidatesTokenCount:
					extractionResult.usageMetadata?.candidatesTokenCount,
				cachedContentTokenCount:
					extractionResult.usageMetadata?.cachedContentTokenCount,
				remainingCredits,
			});

			const serviceResponse = ServiceResponse.success(
				"Facts extracted successfully",
				{
					...extractionResult.data,
					credits: remainingCredits,
				},
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error("Error in /api/interview/extract:", error);

			// Log extraction error
			if (Sentry.logger?.error) {
				Sentry.logger.error("Facts extraction failed", {
					requestId,
					user_id: userId,
					user: userPrefix,
					transcriptLength: transcript?.length || 0,
					processingTime: duration,
					error: error instanceof Error ? error.message : String(error),
				});
			} else {
				Sentry.captureException(error, {
					tags: { endpoint: "extract", status: "error" },
					contexts: {
						request: {
							id: requestId,
							transcriptLength: transcript?.length || 0,
							processingTime: duration,
						},
						user: { id: userId, email_prefix: userPrefix },
					},
				});
			}

			const serviceResponse = ServiceResponse.failure(
				"Failed to extract facts from transcript",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} finally {
			// Always remove user lock
			creditsService.removeUserLock(userId);
		}
	},
);
