import * as Sentry from "@sentry/node";
import type { CreditsRepository, CreditsService } from "@/credits";
import type { InterviewService } from "@/interviews";

export class TranscribeAudioWorkflow {
	private creditsRepo: CreditsRepository;
	private creditsService: CreditsService;
	private interviewService: InterviewService;

	constructor(
		creditsRepo: CreditsRepository,
		creditsService: CreditsService,
		interviewService: InterviewService,
	) {
		this.creditsRepo = creditsRepo;
		this.creditsService = creditsService;
		this.interviewService = interviewService;
	}

	async execute(
		userId: string,
		audioBuffer: Buffer,
		mimeType: string,
	): Promise<string> {
		// Check for concurrent operations
		if (await this.creditsService.checkUserLock(userId)) {
			throw new Error(
				"Another operation is in progress, please wait and try again",
			);
		}
		// Set user lock for entire workflow
		this.creditsService.setUserLock(userId);

		// check available credits
		const currentCredits = await this.creditsRepo.getCurrentBalance(userId);
		if (currentCredits <= 0) {
			throw new Error("Not enough credits");
		}

		// Run the transcription workflow
		try {
			const transcriptionResult = await this.interviewService.transcribeAudio(
				audioBuffer,
				mimeType,
				userId,
			);

			if (!transcriptionResult.data) {
				throw new Error("Failed to transcribe audio");
			}
			const transcription = transcriptionResult.data;
			const tokensCount =
				transcriptionResult.usage.inputTokens +
				transcriptionResult.usage.outputTokens;

			this.creditsRepo.consumeCredits(userId, tokensCount, "transcriber");

			return transcription;
		} catch (error) {
			Sentry.captureException(error, {
				tags: { endpoint: "transcribe", status: "error" },
			});
			throw error;
		} finally {
			// Release user lock after completion
			this.creditsService.removeUserLock(userId);
		}
	}
}
