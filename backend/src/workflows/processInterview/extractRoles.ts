import type * as TE from "fp-ts/lib/TaskEither.js";
import { z } from "zod";
import {
	extractionSystemPrompt,
	roleExtractionUserPrompt,
} from "@/constants/interviewPrompts";
import type { AppError } from "@/errors";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import { fillTemplate } from "@/utils";

const RoleLiteSchema = z.object({
	id: z.string().describe("Stable identifier like 'role-1'"),
	title: z
		.string()
		.describe(
			"Job title or role, explicit quote if specified, or the most relevant industry title if not specified explicitly",
		),
	company: z.string().describe("Company name, or 'unknown' if not specified"),
	start_year: z.string().describe("YYYY or 'unknown'"),
	end_year: z.string().describe("YYYY or 'unknown'"),
	experience: z
		.string()
		.describe(
			"My experience in this role, as it was answered in the interview, or 'unknown' if not specified",
		),
	skills: z
		.array(z.string())
		.describe("Skills I used in this role, or empty list if not specified"),
});

const RolesLiteExtractionSchema = z.object({
	roles: z
		.array(RoleLiteSchema)
		.describe(
			"List of roles I had in my career, with details about each role. Empty list if not specified.",
		),
});

export type RoleLite = z.infer<typeof RoleLiteSchema>;
export type RolesLite = z.infer<typeof RolesLiteExtractionSchema>;

export const extractRoles = (
	aiProvider: IGenerativeAIProvider,
	interviewTranscript: string,
	knownRoles: string,
): TE.TaskEither<AppError, ModelResponse<RolesLite>> => {
	const prompt = fillTemplate(roleExtractionUserPrompt, {
		transcript: interviewTranscript,
		roles: knownRoles,
	});

	return aiProvider.generateCompletion(
		"extraction",
		extractionSystemPrompt,
		prompt,
		undefined,
		RolesLiteExtractionSchema,
	);
};
