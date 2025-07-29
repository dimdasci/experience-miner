import type { IRouter } from "express";
import { Router } from "express";
import { authenticateToken } from "@/common/middleware/auth.js";
import {
	extractFacts,
	getAllInterviews,
	getInterviewById,
	transcribeAudio,
	updateAnswer,
} from "./handlers/index.js";
import { upload } from "./utils/fileUpload.js";

export const interviewRouter: IRouter = Router();

// Get all interviews for the authenticated user
interviewRouter.get("/", authenticateToken, getAllInterviews);

// Get interview by ID with all answers
interviewRouter.get("/:id", authenticateToken, getInterviewById);

// Update answer by question number
interviewRouter.put(
	"/:id/answers/:questionNumber",
	authenticateToken,
	updateAnswer,
);

// Transcribe audio to text
interviewRouter.post(
	"/transcribe",
	authenticateToken,
	upload.single("audio"),
	transcribeAudio,
);

// Extract structured facts from interview and complete full workflow
interviewRouter.post("/:id/extract", authenticateToken, extractFacts);
