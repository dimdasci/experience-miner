import type { Answer } from "@/answers";
import type { ExtractedFacts, Role } from "@/experience/types";
import type { Interview } from "@/interviews/types";

/**
 * Build interview context for AI processing
 */
export function buildInterviewContext(
	interview: Interview,
	answers: Answer[],
): string {
	const contextParts: string[] = [];

	contextParts.push(`<title>${interview.title}</title>`);
	contextParts.push(`<overview>${interview.overview}</overview>`);

	if (answers.length > 0) {
		contextParts.push("<answers>");
		for (const answer of answers) {
			if (
				!answer.answer ||
				answer.answer.trim().length <= 32 // Use constant for minAnswerLength
			) {
				continue; // Skip empty or short answers
			}
			contextParts.push(
				`<question number="${answer.question_number}">${answer.question}</question>`,
			);
			contextParts.push(`<answer>${answer.answer}</answer>`);
		}
	} else {
		contextParts.push("No answers provided for this interview yet.");
	}

	return `<interview id="${interview.id}">\n${contextParts.join("\n\n")}\n</interview>`;
}

/**
 * Build career facts context for AI processing
 * Wrapper for buildCareerContext
 */
export function buildFactsContext(extractedFacts: ExtractedFacts): string {
	if (!extractedFacts) return "No career facts available so far.";

	return buildCareerContext(extractedFacts.roles);
}

/**
 * Builds a text representation of the career profile without summary
 */
export function buildCareerContext(roles: Role[]): string {
	const parts: string[] = [];

	if (roles.length > 0) {
		parts.push("## Career Profile (as updated so far)");
		parts.push("");

		for (const role of roles) {
			parts.push(buildKnownRoleMarkdown(role));

			if (role.projects && role.projects.length > 0) {
				parts.push(buildKnownProjectsMarkdown(role));
			}

			parts.push(""); // Add empty line between roles
		}
	} else {
		parts.push("No professional experience extracted yet.");
	}

	return parts.join("\n");
}

/**
 * Creates a markdown representation of a role without projects
 */
export function buildKnownRoleMarkdown(role: Role): string {
	const parts: string[] = [];
	parts.push(
		`### ${role.title} at ${role.company} (${role.start_year} - ${role.end_year})`,
	);

	if (role.experience && role.experience !== "unknown") {
		parts.push(`**Experience**: ${role.experience}`);
	}

	if (role.skills && role.skills.length > 0) {
		parts.push(`**Skills**: ${role.skills.join(", ")}`);
	}

	return parts.length > 0
		? parts.join("\n\n")
		: "No known roles for this user.\n";
}

/**
 * Creates a markdown representation of projects for a specific role
 */
export function buildKnownProjectsMarkdown(role: Role): string {
	if (!role.projects || role.projects.length === 0) {
		return "No known projects for this role.";
	}

	const parts: string[] = [];
	parts.push(`#### Projects at ${role.company} (${role.title}):`);

	for (const project of role.projects) {
		parts.push(`**${project.name}**: ${project.goal}`);

		if (project.achievements && project.achievements.length > 0) {
			parts.push("Achievements:");
			for (const achievement of project.achievements) {
				parts.push(`- ${achievement}`);
			}
		}
	}

	return parts.length > 0
		? parts.join("\n")
		: "No known projects for this role.\n";
}
