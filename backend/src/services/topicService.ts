import type { Topic } from "@/common/types/business.js";

interface ExtractedFacts {
	achievements?: Array<{ description: string }>;
	companies?: Array<{ name: string }>;
	projects?: Array<{ name: string; description: string; role: string }>;
	roles?: Array<{ title: string; company: string; duration: string }>;
	skills?: Array<{ name: string }>;
	summary?: { text: string };
}

/**
 * Service for topic generation and management operations
 * Contains stub implementations for business logic
 */
class TopicService {
	/**
	 * Generate new topic candidates based on extracted interview data
	 * @param extractedFacts - The structured facts extracted from interview
	 * @param userId - User ID for personalization
	 * @returns Array of 2-3 new topic candidates
	 */
	async generateTopicCandidates(
		_extractedFacts: ExtractedFacts,
		_userId: string,
	): Promise<Topic[]> {
		// STUB: Mock implementation for topic generation
		// TODO: Implement actual AI-based topic generation logic

		const mockCandidates: Topic[] = [
			{
				id: `generated_${Date.now()}_1`,
				user_id: _userId,
				title: "Leadership & Team Management",
				motivational_quote:
					"Great leaders inspire others to achieve their best.",
				status: "available",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				questions: [
					{
						text: "Tell me about a time when you had to lead a difficult project or team through a challenging situation.",
						order: 1,
					},
					{
						text: "How do you approach mentoring and developing team members?",
						order: 2,
					},
					{
						text: "Describe a situation where you had to make a tough decision that affected your team.",
						order: 3,
					},
				],
			},
			{
				id: `generated_${Date.now()}_2`,
				user_id: _userId,
				title: "Technical Innovation & Problem Solving",
				motivational_quote:
					"Innovation distinguishes between a leader and a follower.",
				status: "available",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				questions: [
					{
						text: "Walk me through a complex technical challenge you solved and your approach.",
						order: 1,
					},
					{
						text: "How do you stay current with emerging technologies in your field?",
						order: 2,
					},
					{
						text: "Describe a time when you had to learn a new technology quickly for a project.",
						order: 3,
					},
				],
			},
			{
				id: `generated_${Date.now()}_3`,
				user_id: _userId,
				title: "Cross-functional Collaboration",
				motivational_quote: "Teamwork makes the dream work.",
				status: "available",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				questions: [
					{
						text: "Tell me about a project where you worked closely with other departments or teams.",
						order: 1,
					},
					{
						text: "How do you handle conflicts or disagreements in cross-functional teams?",
						order: 2,
					},
					{
						text: "Describe a time when you had to influence without authority.",
						order: 3,
					},
				],
			},
		];

		// Return 2-3 candidates based on extracted facts
		// In real implementation, would analyze extractedFacts to determine relevant topics
		return mockCandidates.slice(0, 2);
	}

	/**
	 * Rerank all topics (new candidates + existing unused) by relevance
	 * @param newCandidates - Newly generated topic candidates
	 * @param existingTopics - All existing topics for the user
	 * @param extractedFacts - Current extraction context for ranking
	 * @returns Reranked array of all topics
	 */
	async rerankAllTopics(
		newCandidates: Topic[],
		existingTopics: Topic[],
		_extractedFacts: ExtractedFacts,
	): Promise<Topic[]> {
		// STUB: Mock implementation for topic reranking
		// TODO: Implement actual AI-based topic relevance scoring

		// Filter only unused existing topics
		const unusedExisting = existingTopics.filter(
			(topic) => topic.status === "available",
		);

		// Combine new candidates with unused existing topics
		// const _allTopics = [...newCandidates, ...unusedExisting]; // Will be used in future implementation

		// Mock ranking logic - in reality would use AI scoring
		// For now, prioritize new candidates and shuffle existing ones
		const reranked = [
			...newCandidates, // New topics get priority
			...unusedExisting.sort(() => Math.random() - 0.5), // Shuffle existing
		];

		return reranked;
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
		// STUB: Simple implementation for topic status management
		// TODO: Implement database updates for topic status changes

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
	 * @returns Final set of active topics
	 */
	async processTopicWorkflow(
		extractedFacts: ExtractedFacts,
		userId: string,
		existingTopics: Topic[],
	): Promise<Topic[]> {
		// Step 1: Generate new topic candidates
		const newCandidates = await this.generateTopicCandidates(
			extractedFacts,
			userId,
		);

		// Step 2: Rerank all topics
		const rerankedTopics = await this.rerankAllTopics(
			newCandidates,
			existingTopics,
			extractedFacts,
		);

		// Step 3: Mark irrelevant topics (keep top 5)
		const finalTopics = await this.markIrrelevantTopics(rerankedTopics, 5);

		return finalTopics;
	}
}

export const topicService = new TopicService();
