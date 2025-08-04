import { z } from "zod";

/**
 * Experience domain types
 */
export interface ExperienceRecord {
	user_id: string;
	payload: ExtractedFacts;
	updated_at: string;
}

// Generative AI types
export const SourceRefSchema = z.object({
	interview_id: z
		.number()
		.describe("Interview ID where the fact was extracted"),
	question_number: z.number().describe("Question number in the interview"),
});

export const ProjectSchema = z.object({
	name: z.string().describe("Project name"),
	goal: z.string().describe("Goal of the project"),
	achievements: z
		.array(z.string())
		.describe("Achievements user made in the project"),
});

export const RoleSchema = z.object({
	title: z
		.string()
		.describe(
			"Job title or role, explicit quote if specified, or the most relevant industry title if not specified explicitly",
		),
	company: z.string().describe("Company name, or 'unknown' if not specified"),
	start_year: z
		.string()
		.describe(
			"Start year of the role, e.g. '2020' or 'unknown' if not specified",
		),
	end_year: z
		.string()
		.describe(
			"End year of the role, e.g. '2021' or 'unknown' if not specified",
		),
	experience: z
		.string()
		.describe(
			"User experience in this role, as it was described in the interview, or 'unknown' if not specified",
		),
	projects: z
		.array(ProjectSchema)
		.describe(
			"Projects user worked on in this role, or empty list if not specified",
		),
	skills: z
		.array(z.string())
		.describe("Skills used in this role, or empty list if not specified"),
	sources: z
		.array(SourceRefSchema)
		.describe(
			"Sources of information for this role, e.g. list of interview ID and question number",
		),
});

export const ExtractedFactsSchema = z.object({
	summary: z.object({
		text: z.string().describe("Summary text of the professional experience"),
		basedOnInterviews: z.array(z.number()),
	}),
	roles: z
		.array(RoleSchema)
		.describe(
			"List of roles user had in their career, with details about each role",
		),
});

// Export types

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
