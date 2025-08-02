// Prompts to use for topic operations

export const topicSystemPrompt =
	"You are a career coach helping users remember and structure the career path.";

// Prompt for generating new topic candidates based on extracted facts
export const topicGenerationPrompt = `Based on the following career information, generate 1 new interview topic that would help extract additional valuable career details.

Career Context:
{context}

Requirements:
- Generate topics that complement existing information
- Each topic should have 4-6 specific, open-ended questions
- Focus on concrete experiences, projects, skills, and achievements
- Avoid personal relationships, conflicts, or reasons for leaving jobs
- Questions should encourage detailed storytelling
- Include a motivational quote for each topic
- Number questions starting from 1 for each topic

Generate topics that would uncover valuable career information not already covered.`;

// Reranking prompt for topics based on extracted facts
export const topicRankingPrompt = `Rank these interview topics by relevance to extracting valuable career information based on the user's background.

User's Career Context:
{context}

Topics to rank:
{allTopics}

Requirements:
- Return indices of topics ranked by potential value (most valuable first)
- Consider diversity - avoid too many similar topics
- Prioritize topics that would reveal new information
- Include all {topic_amount} topic indices in the ranking
- Provide brief reasoning for the ranking decisions`;
