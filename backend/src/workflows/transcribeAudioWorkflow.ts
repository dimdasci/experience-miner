import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { CreditsRepository, CreditsService } from "@/credits";
import { type AppError, BadRequestError } from "@/errors";
import type { IGenerativeAIProvider } from "@/providers";
import type { ModelResponse } from "@/providers/ai";
import { WorkflowBase } from "./shared/workflowBase";
import { TranscriptionFlow } from "./transcribeAudio/transcriptionFlow";

export class TranscribeAudioWorkflow extends WorkflowBase {
	private transcriptionFlow: TranscriptionFlow;

	constructor(
		creditsRepo: CreditsRepository,
		creditsService: CreditsService,
		aiProvider: IGenerativeAIProvider,
	) {
		super(creditsRepo, creditsService);
		this.transcriptionFlow = new TranscriptionFlow(aiProvider);
	}

	execute(
		userId: string,
		audioBuffer: Buffer,
		mimeType: string,
	): TE.TaskEither<AppError, string> {
		return this.executeWithCreditsAndLocking(
			userId,
			"TranscribeAudioWorkflow",
			() => this.runTranscription(userId, audioBuffer, mimeType),
		);
	}

	private runTranscription(
		userId: string,
		audioBuffer: Buffer,
		mimeType: string,
	): TE.TaskEither<AppError, string> {
		return pipe(
			// Run transcription
			this.transcriptionFlow.execute(audioBuffer, mimeType, userId),
			TE.flatMap((transcriptionResult: ModelResponse<string>) => {
				if (!transcriptionResult.data) {
					return TE.left(new BadRequestError("Failed to transcribe audio"));
				}

				const tokensCount =
					transcriptionResult.usage.inputTokens +
					transcriptionResult.usage.outputTokens;

				// Consume credits and return transcription
				return pipe(
					this.consumeCredits(userId, tokensCount, "transcriber"),
					TE.map(() => transcriptionResult.data || ""),
				);
			}),
		);
	}
}
