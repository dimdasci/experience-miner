import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { z } from "zod";
import {
	extractionSystemPrompt,
	extractionUserPrompt,
} from "@/constants/interviewPrompts";
import type { AppError } from "@/errors";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import { fillTemplate } from "@/utils";

const summarySchema = z.object({
	background: z.string(),
	keyExperiences: z.array(z.string()),
	distinctiveness: z.string(),
	problemSolving: z.string(),
	pitch: z.string(),
});

export const generateSummary = (
	aiProvider: IGenerativeAIProvider,
	careerContext: string,
): TE.TaskEither<AppError, ModelResponse<string>> => {
	const prompt = fillTemplate(extractionUserPrompt, { careerContext });

	return pipe(
		aiProvider.generateCompletion(
			"extraction",
			extractionSystemPrompt,
			prompt,
			undefined,
			summarySchema,
		),
		TE.map((modelResponse: ModelResponse<z.infer<typeof summarySchema>>) => ({
			data: modelResponse.data?.pitch,
			usage: modelResponse.usage,
		})),
	);
};
