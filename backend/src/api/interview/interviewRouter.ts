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
		if (!req.file) {
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

			const serviceResponse = ServiceResponse.success(
				"Audio transcribed successfully",
				{
					transcript,
				},
			);

			return res.status(serviceResponse.statusCode).json(serviceResponse);
		} catch (error) {
			console.error("Error in /api/interview/transcribe:", error);

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

	if (!transcript || typeof transcript !== "string") {
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

		const serviceResponse = ServiceResponse.success(
			"Facts extracted successfully",
			extractedFacts,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	} catch (error) {
		console.error("Error in /api/interview/extract:", error);

		const serviceResponse = ServiceResponse.failure(
			"Failed to extract facts from transcript",
			null,
			StatusCodes.INTERNAL_SERVER_ERROR,
		);

		return res.status(serviceResponse.statusCode).json(serviceResponse);
	}
});
