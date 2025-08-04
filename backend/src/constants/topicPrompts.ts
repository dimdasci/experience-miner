// Prompts to use for topic operations

export const topicSystemPrompt =
	"You are a career coach helping users remember and structure the career path.";

// Prompt for generating new topic candidates based on extracted facts
export const topicGenerationPrompt = `Based on the following career information, generate 1 new interview topic that would help collect full and detailed career information.

Career Context:
{context}

Requirements:
- Generate topics that complement existing information with a specific focus
- Collect broad career information first, like all roles and experiences, and go deeper after role by role
- Each topic should have 4-6 specific, open-ended questions. Aim broad topics to collect the path overview, then narrow down to specific roles and experiences.
- When you learn enough to see the full career path, conduct interviews for every role with a focus on concrete experiences, projects, skills, and achievements. Start with most recent and then go back in time.
- Avoid personal relationships, conflicts, or reasons for leaving jobs
- Questions should encourage detailed storytelling
- Include a motivational quote for each topic which helps both of you and the user stay focused and understand how the answer will improve their career path fact collection
- Number questions starting from 1 for each topic

Generate the best next topics for the provided context.`;

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
