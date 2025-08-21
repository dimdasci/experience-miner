import * as Sentry from "@sentry/node";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import type { Answer, AnswerRepository } from "@/answers";
import { type AppError, BadRequestError } from "@/errors";
import type { ExperienceRepository } from "@/experience";
import type {
	ExperienceRecord,
	ExtractedFacts,
	Project,
} from "@/experience/types";
import type { InterviewRepository } from "@/interviews";
import type { Interview } from "@/interviews/types";
import type { IGenerativeAIProvider, ModelResponse } from "@/providers/ai";
import {
	buildCareerContext,
	buildInterviewContext,
	buildKnownProjectsMarkdown,
	buildKnownRoleMarkdown,
} from "./contextBuilder";
import { convertToProject, convertToRole, mergeRoles } from "./extractHelpers";
import { extractProjects } from "./extractProjects";
import { extractRoles, type RoleLite, type RolesLite } from "./extractRoles";
import { generateSummary } from "./summarizeProfile";

/**
 * Handles the fact extraction flow from interview data
 */
export class ExtractFactsFlow {
	private aiProvider: IGenerativeAIProvider;
	private interviewRepo: InterviewRepository;
	private answerRepo: AnswerRepository;
	private experienceRepo: ExperienceRepository;

	constructor(
		aiProvider: IGenerativeAIProvider,
		interviewRepo: InterviewRepository,
		answerRepo: AnswerRepository,
		experienceRepo: ExperienceRepository,
	) {
		this.aiProvider = aiProvider;
		this.interviewRepo = interviewRepo;
		this.answerRepo = answerRepo;
		this.experienceRepo = experienceRepo;
	}

	/**
	 * Extract facts from interview data
	 */
	execute(
		interviewId: number,
		userId: string,
	): TE.TaskEither<AppError, ModelResponse<ExtractedFacts>> {
		return pipe(
			// Get interview data and answers in parallel
			TE.Do,
			TE.bind(
				"interview",
				(): TE.TaskEither<AppError, Interview> =>
					this.interviewRepo.getById(userId, interviewId),
			),
			TE.bind(
				"answers",
				(): TE.TaskEither<AppError, Answer[]> =>
					this.answerRepo.getByInterviewId(userId, interviewId),
			),
			TE.bind(
				"previousFacts",
				(): TE.TaskEither<AppError, ExperienceRecord | null> =>
					pipe(
						this.experienceRepo.getByUserId(userId),
						TE.map((record): ExperienceRecord | null => record),
						TE.orElse((error) => {
							// If it's a NotFoundError, return null instead of failing
							if (error.errorCode === "NOT_FOUND") {
								return TE.right(null);
							}
							return TE.left(error);
						}),
					),
			),
			TE.flatMap(
				({
					interview,
					answers,
					previousFacts,
				}: {
					interview: Interview;
					answers: Answer[];
					previousFacts: ExperienceRecord | null;
				}): TE.TaskEither<AppError, ModelResponse<ExtractedFacts>> => {
					// Filter answered questions
					const answeredQuestions = answers.filter(
						(a) => a.answer && a.answer.trim().length > 32, // Use constant for minAnswerLength
					);

					if (answeredQuestions.length === 0) {
						return TE.left(
							new BadRequestError("No answered questions found for extraction"),
						);
					}

					// Build interview context
					const interviewContext = buildInterviewContext(
						interview,
						answeredQuestions,
					);

					// Track token usage across all API calls
					let totalInputTokens = 0;
					let totalOutputTokens = 0;

					// Step 2: Build known roles string from previous facts
					const previousRoles = previousFacts?.payload?.roles || [];
					const knownRoles = previousRoles
						.map((role) => buildKnownRoleMarkdown(role))
						.join("\n\n");

					// Step 3: For each role from previousFacts build knownProjects as string
					const rolesWithProjects: { [roleId: string]: string } = {};
					for (const role of previousRoles) {
						rolesWithProjects[role.id] = buildKnownProjectsMarkdown(role);
					}

					Sentry.logger?.info?.("Fact extraction started", {
						user_id: userId,
						interviewId,
						answeredQuestionsCount: answeredQuestions.length,
					});

					// Step 4: Call extractRoles function
					return pipe(
						extractRoles(this.aiProvider, interviewContext, knownRoles),
						TE.map((rolesResponse) => {
							totalInputTokens += rolesResponse.usage.inputTokens;
							totalOutputTokens += rolesResponse.usage.outputTokens;
							return rolesResponse.data ?? { roles: [] };
						}),
						TE.flatMap((extractedRolesData: RolesLite) => {
							const extractedRoles = extractedRolesData.roles || [];

							// Step 5: For each role, extract projects
							const projectsPromises: TE.TaskEither<
								AppError,
								{ role: RoleLite; projects: Project[] }
							>[] = extractedRoles.map((role) => {
								const knownProjectsForRole =
									rolesWithProjects[role.id] ||
									"No known projects for this role.";
								const roleText = buildKnownRoleMarkdown(convertToRole(role));

								return pipe(
									extractProjects(
										this.aiProvider,
										interviewContext,
										roleText,
										knownProjectsForRole,
									),
									TE.map((projectsResponse) => {
										totalInputTokens += projectsResponse.usage.inputTokens;
										totalOutputTokens += projectsResponse.usage.outputTokens;

										// Convert ProjectLite[] to Project[]
										const projects = (
											projectsResponse.data?.projects || []
										).map((p) => convertToProject(p));

										return { role, projects };
									}),
								);
							});

							// Wait for all project extraction to complete
							return pipe(
								TE.sequenceArray(projectsPromises),
								TE.map((rolesWithExtractedProjects) => {
									// Step 6a: Convert RoleLite to Role with their extracted projects
									const convertedRoles = extractedRoles.map((roleLite) => {
										// Find projects for this role
										const roleWithProjects = rolesWithExtractedProjects.find(
											(r) => r.role.id === roleLite.id,
										);
										const projects = roleWithProjects?.projects || [];

										// Convert to full Role with projects
										return convertToRole(roleLite, projects);
									});

									// Step 6b: Merge previous and converted roles
									const mergedRoles = mergeRoles(
										previousRoles || [],
										convertedRoles,
									);

									// Step 7: Create career context
									const careerContext = buildCareerContext(mergedRoles);
									return { mergedRoles, careerContext };
								}),
								TE.flatMap(
									({
										mergedRoles,
										careerContext,
									}): TE.TaskEither<AppError, ModelResponse<ExtractedFacts>> =>
										// Step 8: Generate summary
										pipe(
											generateSummary(this.aiProvider, careerContext),
											TE.map((summaryResponse) => {
												totalInputTokens += summaryResponse.usage.inputTokens;
												totalOutputTokens += summaryResponse.usage.outputTokens;

												// Step 9: Create new ExtractedFacts object
												const extractedFacts: ExtractedFacts = {
													summary: {
														text: summaryResponse.data || "",
														basedOnInterviews: [interviewId],
													},
													roles: mergedRoles,
												};

												// Step 10: Return ModelResponse with combined token usage
												return {
													data: extractedFacts,
													usage: {
														inputTokens: totalInputTokens,
														outputTokens: totalOutputTokens,
													},
												};
											}),
										),
								),
							);
						}),
					);
				},
			),
		);
	}
}
