import type { ExtractedFacts } from "@/experience/types";
import type { Topic } from "@/topics";

/**
 * Shared types for workflow implementations
 */

export interface WorkflowResult {
	extractedFacts: ExtractedFacts;
	newTopics: Topic[];
	extractionTokenCount: number;
	generationTokenCount: number;
	rerankingTokenCount: number;
}

export interface WorkflowContext {
	userId: string;
	startTime: number;
}
