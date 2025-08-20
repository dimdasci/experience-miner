import type { Answer } from "@/answers";
import { aiConfig } from "@/config";
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
	contextParts.push(
		`<motivational_quote>${interview.motivational_quote}</motivational_quote>`,
	);

	if (answers.length > 0) {
		contextParts.push("<answers>");
		for (const answer of answers) {
			if (
				!answer.answer ||
				answer.answer.trim().length <= aiConfig.minAnswerLength
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
 */
export function buildFactsContext(extractedFacts: ExtractedFacts): string {
	if (!extractedFacts) return "";

	const parts: string[] = [];

	if (extractedFacts.roles?.length > 0) {
		parts.push("<roles>");
		parts.push(extractedFacts.roles.map((r) => addRole(r)).join("\n"));
		parts.push("</roles>");
	}
	parts.push("<summary>/n");
	parts.push(`<text>${extractedFacts.summary.text}</text>`);
	parts.push("</summary>");

	return `<career_path>\n${parts.join("\n")}\n</career_path>`;
}

/**
 * Add role information to context
 */
function addRole(role: Role): string {
	const parts: string[] = [];
	parts.push(
		`<role company="${role.company}" start="${role.start_year}" end="${role.end_year}">`,
	);
	parts.push(`<title>${role.title}</title>`);
	parts.push(`<experience>${role.experience}</experience>`);
	if (role.projects && role.projects.length > 0) {
		parts.push("<projects>");
		parts.push(
			role.projects
				.map(
					(p) =>
						`<project>\n<name>${p.name}</name>\n<goal>${p.goal}</goal>\n${p.achievements
							.map((a) => `<achievement>${a}</achievement>`)
							.join("\n")}\n</project>`,
				)
				.join("\n"),
		);
		parts.push("</projects>");
	}
	if (role.skills && role.skills.length > 0) {
		parts.push("<skills>");
		parts.push(role.skills.map((s) => `<skill>${s}</skill>`).join("\n"));
		parts.push("</skills>");
	}
	return `<role company="${role.company}" start="${role.start_year}" end="${role.end_year}">\n<title>${role.title}</title>\n</role>`;
}
