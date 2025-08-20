import { z } from "zod";

/**
 * Experience domain types
 */
export interface ExperienceRecord {
	user_id: string;
	payload: ExtractedFacts;
	updated_at: string;
}

// TODO: Add references
export const SourceRefSchema = z.object({
	interview_id: z
		.number()
		.describe("Interview ID where the fact was extracted"),
	question_number: z.number().describe("Question number in the interview"),
});

// Generative AI types

export const ProjectSchema = z.object({
	id: z.string().describe("Stable project ID like 'proj-1'"),
	name: z.string().describe("Project name"),
	goal: z.string().describe("Goal of the project"),
	achievements: z
		.array(z.string())
		.describe("Achievements I made in the project"),
});

export const RoleSchema = z.object({
	id: z.string().describe("Stable identifier like 'role-1'"),
	title: z
		.string()
		.describe(
			"Job title or role, explicit quote if specified, or the most relevant industry title if not specified explicitly",
		),
	company: z.string().describe("Company name, or 'unknown' if not specified"),
	start_year: z
		.string()
		.describe("Start year of the role, YYYY or 'unknown' if not specified"),
	end_year: z
		.string()
		.describe("End year of the role, YYYY or 'unknown' if not specified"),
	experience: z
		.string()
		.describe(
			"My experience in this role, as it was answered in the interview, or 'unknown' if not specified",
		),
	projects: z
		.array(ProjectSchema)
		.describe(
			"Projects I worked on in this role, or empty list if not specified",
		),
	skills: z
		.array(z.string())
		.describe("Skills I used in this role, or empty list if not specified"),
});

export const ExtractedFactsSchema = z.object({
	summary: z.object({
		text: z.string().describe("Summary text of my professional experience"),
		basedOnInterviews: z.array(z.number()),
	}),
	roles: z
		.array(RoleSchema)
		.describe("List of roles I had in my career, with details about each role"),
});

// Export types

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
