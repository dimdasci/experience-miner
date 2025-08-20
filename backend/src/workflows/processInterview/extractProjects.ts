import type * as TE from "fp-ts/lib/TaskEither.js";
import { z } from "zod";
import {
	projectExtractionSystemPrompt,
	projectExtractionUserPrompt,
} from "@/constants/interviewPrompts";
import type { AppError } from "@/errors";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import { fillTemplate } from "@/utils";

const ProjectLiteSchema = z.object({
	id: z.string().describe("Stable project ID like 'proj-1'"),
	name: z
		.string()
		.describe(
			"Project name, as it was mentioned in the interview explicitly, or relevant implicit short name",
		),
	goal: z.string().describe("What the goal of the project is"),
	achievements: z
		.array(z.string())
		.describe(
			"List of achievements in the project, or empty list if not specified",
		),
});

const ProjectsLiteSchema = z.object({
	projects: z
		.array(ProjectLiteSchema)
		.describe(
			"Projects I worked on in this role, or empty list if not specified",
		),
});

export type ProjectLite = z.infer<typeof ProjectLiteSchema>;
export type ProjectsLite = z.infer<typeof ProjectsLiteSchema>;

export const extractProjects = (
	aiProvider: IGenerativeAIProvider,
	interviewTranscript: string,
	roleText: string,
	knownProjects: string,
): TE.TaskEither<AppError, ModelResponse<ProjectsLite>> => {
	const prompt = fillTemplate(projectExtractionUserPrompt, {
		transcript: interviewTranscript,
		role: roleText,
		projects: knownProjects,
	});

	return aiProvider.generateCompletion(
		"extraction",
		projectExtractionSystemPrompt,
		prompt,
		undefined,
		ProjectsLiteSchema,
	);
};
