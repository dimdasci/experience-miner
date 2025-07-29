import { GoogleGenAI, Type } from "@google/genai";
import * as Sentry from "@sentry/node";
import { aiConfig } from "@/config/ai.js";
import type {
	AITopicQuestion,
	AITopicResponse,
	ExtractedFactsAI,
	TopicGenerationResponse,
	TopicRerankingResponse,
	TopicServiceResponse,
} from "@/types/ai/index.js";
import type { Topic } from "@/types/database/index.js";

/**
 * Service for topic generation and management operations
 * Contains AI-powered topic generation and ranking logic
 */
class TopicService {
	private ai: GoogleGenAI;

	constructor(aiClient?: GoogleGenAI) {
		this.ai = aiClient || new GoogleGenAI({ apiKey: aiConfig.apiKey });
	}
	/**
	 * Generate new topic candidates based on extracted interview data
	 * @param extractedFacts - The structured facts extracted from interview
	 * @param userId - User ID for personalization
	 * @returns Response with topic candidates and token usage
	 */
	async generateTopicCandidates(
		extractedFacts: ExtractedFactsAI,
		userId: string,
	): Promise<TopicServiceResponse<Topic[]>> {
		try {
			// Build context from extracted facts
			const companiesContext =
				extractedFacts.companies?.map((c) => c.name).join(", ") ||
				"None specified";
			const rolesContext =
				extractedFacts.roles
					?.map((r) => `${r.title} at ${r.company}`)
					.join(", ") || "None specified";
			const projectsContext =
				extractedFacts.projects
					?.map((p) => `${p.name}: ${p.description}`)
					.slice(0, 3)
					.join("; ") || "None specified";
			const skillsContext =
				extractedFacts.skills
					?.map((s) => s.name)
					.slice(0, 10)
					.join(", ") || "None specified";
			const achievementsContext =
				extractedFacts.achievements
					?.map((a) => a.description)
					.slice(0, 3)
					.join("; ") || "None specified";
			const summaryContext =
				extractedFacts.summary?.text || "No summary available";

			const responseSchema = {
				type: Type.OBJECT,
				properties: {
					topics: {
						type: Type.ARRAY,
						description: "Array of 2-3 new topic candidates",
						items: {
							type: Type.OBJECT,
							properties: {
								title: {
									type: Type.STRING,
									description:
										"Clear, engaging topic title (e.g. 'Problem-Solving Under Pressure', 'Building Client Relationships')",
								},
								motivational_quote: {
									type: Type.STRING,
									description:
										"Descriptive, encouraging quote that relates to the topic without being prescriptive",
								},
								questions: {
									type: Type.ARRAY,
									description: "Exactly 3 questions for this topic",
									items: {
										type: Type.OBJECT,
										properties: {
											text: { type: Type.STRING },
											order: { type: Type.NUMBER },
										},
										required: ["text", "order"],
									},
								},
							},
							required: ["title", "motivational_quote", "questions"],
						},
					},
				},
				required: ["topics"],
			};

			const prompt = `You are a career interview coach helping users mine their professional experiences. Based on the user's career information below, generate 2-3 new interview topics that would help uncover valuable aspects of their experience not fully explored yet.

CAREER CONTEXT:
Summary: ${summaryContext}
Companies: ${companiesContext}
Roles: ${rolesContext}  
Key Projects: ${projectsContext}
Skills: ${skillsContext}
Achievements: ${achievementsContext}

TOPIC GENERATION GUIDELINES:
- Focus on gaps in their experience story that would be valuable to explore
- Create topics that work for everyone from students to executives, makers to maintainers
- Use descriptive, encouraging language that shows everyone contributes value
- Balance high-level career themes with specific technical/professional areas
- Ensure topics help build a complete picture of their capabilities and growth

For each topic, create:
- An engaging title (4-6 words)
- A motivational quote that's descriptive rather than prescriptive  
- Exactly 5 questions that mix open storytelling, guided exploration, and broader context
- Questions should follow natural progression: situation → approach → impact/learnings

EXAMPLE TOPIC STRUCTURE:
Title: "Learning New Technologies"
Quote: "Every new skill builds on the foundation of curiosity and determination."
Questions:
1. "Tell me about a time when you had to quickly learn something completely new for work."
2. "How do you approach breaking down complex technical concepts when learning?"
3. "What strategies have you developed for staying current in your field?"

Generate topics that would reveal important aspects of this person's professional journey not yet fully covered.`;

			const request = {
				model: aiConfig.models.topicGeneration,
				contents: prompt,
				config: {
					responseMimeType: "application/json",
					responseSchema: responseSchema,
					temperature: 0.8, // Higher creativity for topic generation
				},
			};

			const response = await this.ai.models.generateContent(request);

			if (!response.text) {
				throw new Error("No topic generation response received from AI");
			}

			const jsonText = response.text.trim();
			const aiResponse: TopicGenerationResponse = JSON.parse(jsonText);

			if (!aiResponse.topics || !Array.isArray(aiResponse.topics)) {
				throw new Error("Invalid topic generation response format");
			}

			// Transform AI response to Topic objects (no ID until persisted)
			const currentTimestamp = new Date().toISOString();
			const topics: Topic[] = aiResponse.topics.map(
				(topic: AITopicResponse) => ({
					// id is undefined for new topics - will be set by database
					user_id: userId,
					title: topic.title,
					motivational_quote: topic.motivational_quote,
					status: "available" as const,
					created_at: currentTimestamp,
					updated_at: currentTimestamp,
					questions: topic.questions.map((q: AITopicQuestion) => ({
						text: q.text,
						order: q.order,
					})),
				}),
			);

			return {
				data: topics,
				usageMetadata: response.usageMetadata,
			};
		} catch (error) {
			// Track topic generation error with context
			Sentry.captureException(error, {
				tags: { service: "topic", operation: "generation" },
				contexts: {
					request: {
						userId,
						factsAvailable: {
							companies: extractedFacts.companies?.length || 0,
							roles: extractedFacts.roles?.length || 0,
							projects: extractedFacts.projects?.length || 0,
							skills: extractedFacts.skills?.length || 0,
							achievements: extractedFacts.achievements?.length || 0,
						},
					},
				},
			});

			Sentry.logger?.error?.("Topic generation failed", {
				userId,
				error: error instanceof Error ? error.message : String(error),
			});

			// Return empty array on error to allow workflow to continue
			// The reranking step will work with existing topics only
			return {
				data: [],
				usageMetadata: undefined,
			};
		}
	}

	/**
	 * Rerank all topics (new candidates + existing unused) by relevance
	 * @param newCandidates - Newly generated topic candidates
	 * @param existingTopics - All existing topics for the user
	 * @param extractedFacts - Current extraction context for ranking
	 * @returns Response with reranked topics and token usage
	 */
	async rerankAllTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		extractedFacts: ExtractedFactsAI,
	): Promise<TopicServiceResponse<Topic[]>> {
		try {
			// Filter only unused existing topics
			const unusedExisting = existingTopics.filter(
				(topic) => topic.status === "available",
			);

			// Combine new candidates with unused existing topics
			const allTopics = [...newCandidates, ...unusedExisting];

			// If no topics to rank, return empty array
			if (allTopics.length === 0) {
				return {
					data: [],
					usageMetadata: undefined,
				};
			}

			// If only 1-2 topics, no need for complex ranking
			if (allTopics.length <= 2) {
				return {
					data: allTopics,
					usageMetadata: undefined,
				};
			}

			// Build context for AI ranking
			const companiesContext =
				extractedFacts.companies?.map((c) => c.name).join(", ") ||
				"None specified";
			const rolesContext =
				extractedFacts.roles
					?.map((r) => `${r.title} at ${r.company}`)
					.join(", ") || "None specified";
			const skillsContext =
				extractedFacts.skills
					?.map((s) => s.name)
					.slice(0, 10)
					.join(", ") || "None specified";
			const summaryContext =
				extractedFacts.summary?.text || "No summary available";

			// Prepare topics for ranking with minimal info to save tokens
			const topicsForRanking = allTopics.map((topic, index) => ({
				index,
				title: topic.title,
				questions: topic.questions.map((q) => q.text).join("; "),
			}));

			const responseSchema = {
				type: Type.OBJECT,
				properties: {
					rankedIndices: {
						type: Type.ARRAY,
						description:
							"Array of topic indices ordered by relevance (most relevant first)",
						items: { type: Type.NUMBER },
					},
					reasoning: {
						type: Type.STRING,
						description: "Brief explanation of ranking criteria used",
					},
				},
				required: ["rankedIndices", "reasoning"],
			};

			const prompt = `You are an analytical career coach helping prioritize interview topics for maximum value. 

USER CONTEXT:
Summary: ${summaryContext}
Companies: ${companiesContext}
Roles: ${rolesContext}
Skills: ${skillsContext}

AVAILABLE TOPICS:
${topicsForRanking.map((t) => `${t.index}: "${t.title}" - Questions: ${t.questions}`).join("\n")}

RANKING CRITERIA:
- Most engaging and relevant to mining the complete user experience
- Balance between high-level career themes and specific professional areas  
- Topics that would reveal important gaps or add depth to their story
- Progression that helps build comprehensive career narrative
- Relevance to their specific background and skills

Rank ALL topics from most valuable (first) to least valuable (last) for this user's career story. Return the indices in your preferred order.

Focus on which topics would be most valuable for this specific person to explore next in their career mining journey.`;

			const request = {
				model: aiConfig.models.topicReranking,
				contents: prompt,
				config: {
					responseMimeType: "application/json",
					responseSchema: responseSchema,
					temperature: 0.2, // Lower temperature for analytical ranking
				},
			};

			const response = await this.ai.models.generateContent(request);

			if (!response.text) {
				throw new Error("No topic reranking response received from AI");
			}

			const jsonText = response.text.trim();
			const aiResponse: TopicRerankingResponse = JSON.parse(jsonText);

			if (
				!aiResponse.rankedIndices ||
				!Array.isArray(aiResponse.rankedIndices)
			) {
				throw new Error("Invalid topic reranking response format");
			}

			// Validate and apply ranking
			const validIndices = aiResponse.rankedIndices.filter(
				(index: number) => index >= 0 && index < allTopics.length,
			);

			// If AI didn't return valid indices, fall back to original order
			if (validIndices.length !== allTopics.length) {
				Sentry.logger?.warn?.(
					"Topic reranking returned invalid indices, using fallback",
					{
						expected: allTopics.length,
						received: validIndices.length,
						reasoning: aiResponse.reasoning,
					},
				);
				// Fallback: prioritize new candidates
				return {
					data: [...newCandidates, ...unusedExisting],
					usageMetadata: undefined,
				};
			}

			// Return topics in AI-recommended order
			const rerankedTopics = validIndices
				.map((index: number) => allTopics[index])
				.filter((topic): topic is Topic => topic !== undefined);

			// Log successful reranking for monitoring
			Sentry.logger?.info?.("Topics reranked successfully", {
				totalTopics: allTopics.length,
				newCandidates: newCandidates.length,
				existingTopics: unusedExisting.length,
				reasoning: aiResponse.reasoning,
			});

			return {
				data: rerankedTopics,
				usageMetadata: response.usageMetadata,
			};
		} catch (error) {
			// Track topic reranking error with context
			Sentry.captureException(error, {
				tags: { service: "topic", operation: "reranking" },
				contexts: {
					request: {
						newCandidatesCount: newCandidates.length,
						existingTopicsCount: existingTopics.length,
						factsAvailable: {
							companies: extractedFacts.companies?.length || 0,
							roles: extractedFacts.roles?.length || 0,
							skills: extractedFacts.skills?.length || 0,
						},
					},
				},
			});

			Sentry.logger?.error?.("Topic reranking failed", {
				newCandidatesCount: newCandidates.length,
				existingTopicsCount: existingTopics.length,
				error: error instanceof Error ? error.message : String(error),
			});

			// Fallback to simple ordering: new candidates first, then existing
			const unusedExisting = existingTopics.filter(
				(topic) => topic.status === "available",
			);
			return {
				data: [...newCandidates, ...unusedExisting],
				usageMetadata: undefined,
			};
		}
	}

	/**
	 * Mark topics as irrelevant based on ranking position
	 * @param allTopics - All topics after reranking
	 * @param keepTopCount - Number of top topics to keep active (default: 5)
	 * @returns Updated topics with status changes
	 */
	async markIrrelevantTopics(
		allTopics: Topic[],
		keepTopCount: number = 5,
	): Promise<Topic[]> {
		return allTopics.map((topic, index) => ({
			...topic,
			status: index < keepTopCount ? "available" : ("irrelevant" as const),
		}));
	}

	/**
	 * Complete topic workflow: generate, rerank, and update status
	 * @param extractedFacts - Structured facts from interview extraction
	 * @param userId - User ID for context
	 * @param existingTopics - Current topics for the user
	 * @returns Response with final topics and combined token usage
	 */
	async processTopicWorkflow(
		extractedFacts: ExtractedFactsAI,
		userId: string,
		existingTopics: Topic[],
	): Promise<
		TopicServiceResponse<{
			topics: Topic[];
			generationTokens: number;
			rerankingTokens: number;
		}>
	> {
		// Step 1: Generate new topic candidates
		const generationResult = await this.generateTopicCandidates(
			extractedFacts,
			userId,
		);

		// Step 2: Rerank all topics
		const rerankingResult = await this.rerankAllTopics(
			generationResult.data,
			existingTopics,
			extractedFacts,
		);

		// Step 3: Mark irrelevant topics (keep top 5)
		const finalTopics = await this.markIrrelevantTopics(
			rerankingResult.data,
			5,
		);

		// Calculate token usage for both operations
		const generationTokens =
			generationResult.usageMetadata?.totalTokenCount || 0;
		const rerankingTokens = rerankingResult.usageMetadata?.totalTokenCount || 0;

		return {
			data: {
				topics: finalTopics,
				generationTokens,
				rerankingTokens,
			},
			usageMetadata: {
				totalTokenCount: generationTokens + rerankingTokens,
				promptTokenCount:
					(generationResult.usageMetadata?.promptTokenCount || 0) +
					(rerankingResult.usageMetadata?.promptTokenCount || 0),
				candidatesTokenCount:
					(generationResult.usageMetadata?.candidatesTokenCount || 0) +
					(rerankingResult.usageMetadata?.candidatesTokenCount || 0),
			},
		};
	}
}

export const topicService = new TopicService();
