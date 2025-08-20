import type * as TE from "fp-ts/lib/TaskEither.js";
import { aiConfig } from "@/config";
import {
	extractionSystemPrompt,
	extractionUserPrompt,
} from "@/constants/interviewPrompts";
import type { AppError } from "@/errors";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import { fillTemplate } from "@/utils";

export const generateSummary = (
	aiProvider: IGenerativeAIProvider,
	careerContext: string,
): TE.TaskEither<AppError, ModelResponse<string>> => {
	const prompt = fillTemplate(extractionUserPrompt, { careerContext });

	return aiProvider.generateCompletion(
		aiConfig.models.extraction,
		extractionSystemPrompt,
		prompt,
		undefined,
		0.5,
		aiConfig.maxTokens.extraction,
		undefined,
	);
};
