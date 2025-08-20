import type * as TE from "fp-ts/lib/TaskEither.js";
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
		"extraction",
		extractionSystemPrompt,
		prompt,
		undefined,
		undefined,
	);
};
