import type { ExtractedFacts } from "@/services/transcribeService.js";
import type { AIResponse } from "@/types/ai/index.js";
import type { Topic } from "@/types/database/index.js";

/**
 * AI Provider interface for abstracting different AI service implementations
 * Supports transcription, fact extraction, topic generation, and topic ranking
 */
export interface IAIProvider {
	/**
	 * Transcribe audio buffer to text
	 * @param audioBuffer - The audio data as buffer
	 * @param mimeType - Audio MIME type (e.g., 'audio/wav', 'audio/mp3')
	 * @returns Promise with transcribed text and usage metadata
	 */
	transcribeAudio(
		audioBuffer: Buffer,
		mimeType: string,
	): Promise<AIResponse<string>>;

	/**
	 * Extract structured facts from interview transcript
	 * @param transcript - The interview transcript text
	 * @param interviewId - Interview ID for context
	 * @returns Promise with extracted facts and usage metadata
	 */
	extractFacts(
		transcript: string,
		interviewId: string,
	): Promise<AIResponse<ExtractedFacts>>;

	/**
	 * Generate new topic candidates based on extracted facts
	 * @param extractedFacts - Previously extracted career facts
	 * @param userId - User ID for personalization
	 * @returns Promise with generated topics and usage metadata
	 */
	generateTopics(
		extractedFacts: any, // Using any for now to avoid circular dependencies
		userId: string,
	): Promise<AIResponse<Topic[]>>;

	/**
	 * Rank and filter topics based on relevance to extracted facts
	 * @param newCandidates - New topic candidates to rank
	 * @param existingTopics - Existing user topics for context
	 * @param extractedFacts - Career facts for relevance scoring
	 * @returns Promise with ranked topic indices and usage metadata
	 */
	rankTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		extractedFacts: any, // Using any for now to avoid circular dependencies
	): Promise<AIResponse<number[]>>;
}
