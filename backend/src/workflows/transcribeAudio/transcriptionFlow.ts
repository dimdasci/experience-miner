import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import {
	transcriptionSystemPrompt,
	transcriptionUserPrompt,
} from "@/constants/interviewPrompts";
import type { AppError } from "@/errors";
import type {
	IGenerativeAIProvider,
	MediaData,
	ModelResponse,
} from "@/providers/ai";

/**
 * Handles audio transcription using AI provider
 */
export class TranscriptionFlow {
	private aiProvider: IGenerativeAIProvider;

	constructor(aiProvider: IGenerativeAIProvider) {
		this.aiProvider = aiProvider;
	}

	/**
	 * Transcribe audio to text
	 */
	execute(
		audioBuffer: Buffer,
		mimeType: string,
		userId: string,
	): TE.TaskEither<AppError, ModelResponse<string>> {
		Sentry.logger?.info?.("Audio transcription started", {
			user_id: userId,
			audioSize: audioBuffer.length,
			mimeType,
		});

		return pipe(
			this.aiProvider.generateCompletion(
				"transcription",
				transcriptionSystemPrompt,
				transcriptionUserPrompt,
				{
					data: audioBuffer,
					mimeType,
				} as MediaData,
			) as TE.TaskEither<AppError, ModelResponse<string>>,
			TE.map((transcriptionResult: ModelResponse<string>) => {
				Sentry.logger?.info?.("Audio transcription completed successfully", {
					user_id: userId,
					transcriptLength: transcriptionResult.data?.length || 0,
					input_token: transcriptionResult.usage?.inputTokens || 0,
					output_token: transcriptionResult.usage?.outputTokens || 0,
				});

				return transcriptionResult;
			}),
			TE.mapLeft((error) => {
				Sentry.logger?.error?.("Audio transcription failed", {
					user_id: userId,
					audioSize: audioBuffer.length,
					mimeType,
					error: error instanceof Error ? error.message : String(error),
				});

				return error; // Already an AppError from provider
			}),
		);
	}
}
