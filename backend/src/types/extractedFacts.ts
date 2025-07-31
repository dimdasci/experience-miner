import { z } from "zod";

export const SourceRefSchema = z.object({
	interview_id: z.number(),
	question_number: z.number(),
});

export const AchievementSchema = z.object({
	description: z.string(),
	sources: z.array(SourceRefSchema),
});

export const CompanySchema = z.object({
	name: z.string(),
	sources: z.array(SourceRefSchema),
});

export const ProjectSchema = z.object({
	name: z.string(),
	description: z.string(),
	role: z.string(),
	company: z.string().optional(),
	sources: z.array(SourceRefSchema),
});

export const RoleSchema = z.object({
	title: z.string(),
	company: z.string(),
	duration: z.string(),
	sources: z.array(SourceRefSchema),
});

export const SkillSchema = z.object({
	name: z.string(),
	category: z.string().optional(),
	sources: z.array(SourceRefSchema),
});

export const ExtractedFactsSchema = z.object({
	summary: z.object({
		basedOnInterviews: z.array(z.number()),
	}),
	companies: z.array(CompanySchema),
	roles: z.array(RoleSchema),
	projects: z.array(ProjectSchema),
	achievements: z.array(AchievementSchema),
	skills: z.array(SkillSchema),
});

// Export types

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
