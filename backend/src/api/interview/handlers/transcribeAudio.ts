import * as TE from "fp-ts/lib/TaskEither";
import { ServiceContainer } from "@/container/serviceContainer.js";
import { AppErrors, BadRequestError } from "@/errors";
import type { AuthenticatedRequest } from "@/middleware/auth.js";
import { wrapTaskEither } from "@/utils/asyncWrap.js";

/**
 * Functional HTTP handler for transcribing audio to text
 * Uses TaskEither composition and workflow for clean error handling
 */
export const transcribeAudio = wrapTaskEither((req: AuthenticatedRequest) => {
	const userId = req.user?.id;

	if (!userId) {
		return TE.left(AppErrors.unauthorized("Invalid user authentication"));
	}

	if (!req.file) {
		return TE.left(new BadRequestError("Audio file is required"));
	}

	const workflow = ServiceContainer.getInstance().getTranscribeAudioWorkflow();

	return workflow.execute(userId, req.file.buffer, req.file.mimetype);
}, "Audio transcribed successfully");
