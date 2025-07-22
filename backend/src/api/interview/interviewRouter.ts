import * as Sentry from "@sentry/node";
import type { IRouter, Request, Response } from "express";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { ServiceResponse } from "@/common/models/serviceResponse.js";
import type { ExtractedFacts } from "@/common/types/interview.js";
import { geminiService } from "@/services/geminiService.js";

export const interviewRouter: IRouter = Router();

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
	upload.single("audio"),
	async (req: Request, res: Response) => {
		const requestId = crypto.randomUUID();
		const startTime = Date.now();

		// Log transcription request
		Sentry.logger?.info?.("Transcription request started", {
			requestId,
			fileSize: req.file?.size,
			mimeType: req.file?.mimetype,
			hasFile: !!req.file,
		});

		if (!req.file) {
			// Log warning (structured logs if available, fallback to issues)
			if (Sentry.logger?.warn) {
				Sentry.logger.warn("Transcription failed - no file", { requestId });
			} else {
				Sentry.captureMessage("Transcription failed - no audio file provided", {
					level: "warning",
					tags: { endpoint: "transcribe", error: "no_file" },
					contexts: { request: { id: requestId } },
				});
			}

			const serviceResponse = ServiceResponse.failure(
				"No audio file provided",
				null,
				StatusCodes.BAD_REQUEST,
			);
			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}

		try {
			const transcript = await geminiService.transcribeAudio(
				req.file.buffer,
				req.file.mimetype,
			);

			const duration = Date.now() - startTime;

			// Log successful transcription
			Sentry.logger?.info?.("Transcription completed successfully", {
				requestId,
				fileSize: req.file.size,
				transcriptLength: transcript.length,
				processingTime: duration,
				mimeType: req.file.mimetype,
			});

			const serviceResponse = ServiceResponse.success(
				"Audio transcribed successfully",
				{
					transcript,
				},
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error("Error in /api/interview/transcribe:", error);

			// Log transcription error
			if (Sentry.logger?.error) {
				Sentry.logger.error("Transcription failed", {
					requestId,
					fileSize: req.file.size,
					processingTime: duration,
					error: error instanceof Error ? error.message : String(error),
				});
			} else {
				Sentry.captureException(error, {
					tags: { endpoint: "transcribe", status: "error" },
					contexts: {
						request: {
							id: requestId,
							fileSize: req.file.size,
							processingTime: duration,
						},
					},
				});
			}

			const serviceResponse = ServiceResponse.failure(
				"Failed to transcribe audio",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		}
	},
);

// Extract structured facts from transcript
interviewRouter.post("/extract", async (req: Request, res: Response) => {
	const { transcript } = req.body;
	const requestId = crypto.randomUUID();
	const startTime = Date.now();

	// Log extraction request
	Sentry.logger?.info?.("Facts extraction request started", {
		requestId,
		transcriptLength: transcript?.length || 0,
		hasTranscript: !!transcript,
	});

	if (!transcript || typeof transcript !== "string") {
		// Log warning (structured logs if available, fallback to issues)
		if (Sentry.logger?.warn) {
			Sentry.logger.warn("Facts extraction failed - invalid transcript", {
				requestId,
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

	try {
		const extractedFacts: ExtractedFacts =
			await geminiService.extractFacts(transcript);

		const duration = Date.now() - startTime;

		// Log successful extraction with detailed metrics
		const factsCounts = {
			companies: extractedFacts.companies?.length || 0,
			roles: extractedFacts.roles?.length || 0,
			projects: extractedFacts.projects?.length || 0,
			achievements: extractedFacts.achievements?.length || 0,
			skills: extractedFacts.skills?.length || 0,
		};

		Sentry.logger?.info?.("Facts extraction completed successfully", {
			requestId,
			transcriptLength: transcript.length,
			processingTime: duration,
			extractedCounts: factsCounts,
			totalFacts: Object.values(factsCounts).reduce(
				(sum, count) => sum + count,
				0,
			),
		});

		const serviceResponse = ServiceResponse.success(
			"Facts extracted successfully",
			extractedFacts,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		const duration = Date.now() - startTime;
		console.error("Error in /api/interview/extract:", error);

		// Log extraction error
		if (Sentry.logger?.error) {
			Sentry.logger.error("Facts extraction failed", {
				requestId,
				transcriptLength: transcript.length,
				processingTime: duration,
				error: error instanceof Error ? error.message : String(error),
			});
		} else {
			Sentry.captureException(error, {
				tags: { endpoint: "extract", status: "error" },
				contexts: {
					request: {
						id: requestId,
						transcriptLength: transcript.length,
						processingTime: duration,
					},
				},
			});
		}

		const serviceResponse = ServiceResponse.failure(
			"Failed to extract facts from transcript",
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
});
