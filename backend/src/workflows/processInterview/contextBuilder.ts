import type { Answer } from "@/answers";
import { aiConfig } from "@/config";
import type { ExtractedFacts, SourceRef } from "@/experience/types";
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

	return `<interview>\n${contextParts.join("\n\n")}\n</interview>`;
}

/**
 * Build career facts context for AI processing
 */
export function buildFactsContext(extractedFacts: ExtractedFacts): string {
	if (!extractedFacts) return "";

	const parts: string[] = [];

	if (extractedFacts.companies?.length > 0) {
		parts.push("<companies>");
		parts.push(
			`${extractedFacts.companies.map((c) => `<company name="${c.name}">${addSource(c.sources)}</company>`).join("\n")}`,
		);
	}

	if (extractedFacts.roles?.length > 0) {
		parts.push("<roles>");
		parts.push(
			extractedFacts.roles
				.map(
					(r) =>
						`<role company="${r.company}" duration="${r.duration}">\n${addSource(r.sources)}\n<title>${r.title}</title>\n</role>`,
				)
				.join("\n"),
		);
		parts.push("</roles>");
	}

	if (extractedFacts.projects?.length > 0) {
		parts.push("<projects>");
		parts.push(
			extractedFacts.projects
				.map(
					(p) =>
						`<project name="${p.name}" role="${p.role}" company="${p.company}">\n${addSource(p.sources)}\n<description>${p.description}</description>\n</project>`,
				)
				.join("\n"),
		);
		parts.push("</projects>");
	}

	if (extractedFacts.skills?.length > 0) {
		parts.push("<skills>");
		parts.push(
			`${extractedFacts.skills.map((s) => `<skill name="${s.name}" category="${s.category}">\n${addSource(s.sources)}\n</skill>`).join("\n")}`,
		);
		parts.push("</skills>");
	}

	if (extractedFacts.achievements?.length > 0) {
		parts.push("<achievements>");
		parts.push(
			extractedFacts.achievements
				.map(
					(a) =>
						`<achievement>\n${addSource(a.sources)}\n<description>\n${a.description}\n</description>\n</achievement>`,
				)
				.join("\n"),
		);
		parts.push("</achievements>");
	}

	return `<career_path>\n${parts.join("\n")}\n</career_path>`;
}

/**
 * Add source references to context
 */
function addSource(sources: SourceRef[]): string {
	if (!sources || sources.length === 0) {
		return "";
	}

	const sourceElements = sources.map((s) => {
		return `<source interview_id="${s.interview_id}" question_number="${s.question_number}"/>`;
	});
	return `<sources>\n${sourceElements.join("\n")}\n</sources>`;
}
