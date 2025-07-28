import crypto from "node:crypto";
import * as Sentry from "@sentry/node";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "@/common/middleware/auth.js";
import { logger } from "@/common/middleware/requestLogger.js";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import { creditsService } from "@/services/creditsService.js";
import { databaseService } from "@/services/databaseService.js";
import { transcribeService } from "@/services/transcribeService.js";

export const transcribeAudio = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
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
			// Track missing file as warning
			Sentry.captureMessage("Transcription failed - no audio file provided", {
				level: "warning",
				tags: { endpoint: "transcribe", error: "no_file" },
				contexts: {
					request: { id: requestId },
					user: { id: userId, email_prefix: userPrefix },
				},
			});
			// Supplementary logging for user journey analysis
			Sentry.logger?.warn?.("Transcription failed - no file", {
				requestId,
				user_id: userId,
				user: userPrefix,
			});

			const serviceResponse = ServiceResponse.failure(
				"No audio file provided",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		// Process AI transcription
		const transcriptResult = await transcribeService.transcribeAudio(
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
		// Already properly logged with Sentry.captureException above

		// Track transcription error with full context
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
		// Supplementary logging for user journey analysis
		Sentry.logger?.error?.("Transcription failed", {
			requestId,
			user_id: userId,
			user: userPrefix,
			fileSize: req.file?.size,
			processingTime: duration,
			error: error instanceof Error ? error.message : String(error),
		});

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
};
