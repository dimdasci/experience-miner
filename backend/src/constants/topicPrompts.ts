// Prompts to use for topic operations

export const topicSystemPrompt =
	"You are a career coach helping users remember and structure the career path with a series of interviews.";

// Prompt for generating new topic candidates based on extracted facts
export const topicGenerationPrompt = `## Overview

You are designing next step in a user career exploration process. This is a self-paced
process we your task is to keep user engagement by providing relevant and personalized
interview topics. You shouldn't overwhelm the user with too complex questions withing one
topic. You have no limit in a number of interviews to conduct. 

Read the following career information.

Career Context:
{context}

Think about gaps in the information provided and how to address them with next interview. 
Then generate 1 new interview topic that would help close most important gaps for the 
current stage of the user's experience mining process. Do not try to close all gaps at once.


## Interview Structure
- 5 questions maximum for 20-minute completion (~4-5 minutes per question)
- Open-to-specific flow of interview process: Start broad, narrow to details
- User instruction that sets simple, accurate expectations
- Built-in completion message summarizing value delivered

## Question Format (Required Elements)
- Single paragraph with no redundant explanations
- Self-contained with built-in guidance embedded naturally
- References previous answers ("based on what you shared," "choose one you mentioned")
- Multiple questions in one separated by commas for specificity
- Low cognitive load - prefer concrete description and simple preferences over complex self-reflection

## Opening Question Strategy
- "Briefly" sets time/scope expectations
- "What is on top of your mind" gives permission to be selective
- Specific elements requested (names, dates, roles) for structure
- Natural filter - user shares what feels important

## Question Design Patterns

### Pattern 1: Open Overview (Question 1)

"Walk me briefly through your [topic] - [specific elements], what is on top of your mind. Please mention [required details] so we know you better."

Example: "Walk me briefly through your work experience - jobs you've had, what you did, what is on top of your mind. Please mention your employers, dates and roles so we know you better."

### Pattern 2: Current Detail (Question 2)

"Tell me more about your current/recent [topic]. [Specific aspects as comma-separated questions]"

Example: "Tell me more about your current or last work situation. What does a typical day or week look like, your main responsibilities, who do you work with?"

### Pattern 3: User-Chosen Deep Dive (Question 3)

"Choose one [item] you mentioned and describe it in more detail. [Specific aspects as questions]"

Example: "Choose one job you mentioned and describe it in more detail. What did you actually do there day-to-day, what was the work environment like, what tools or skills did you use?"

### Pattern 4: Pattern Recognition (Question 4)

"Looking at your [topic], what do you notice about yourself? [Specific patterns to consider]"

Example: "Looking at your work experience, what do you notice about yourself? What types of work environments do you end up in, what tasks do you tend to do well, how do you work with other people?"

### Pattern 5: Transitions/Process (Question 5)

"Tell me about how you [process/transition]. [Specific aspects as questions]"

Example: "Tell me about how you've moved between jobs. How do you usually find new work, what makes you decide to leave or change jobs?"

### Pattern 6: Future/Goals (Question 6)

"What are you thinking about for your [topic] future? [Specific considerations as questions]"

Example: "What are you thinking about for your work future? Are you looking for something new, what kind of work appeals to you, what would make your work situation better?"

## Task
Generate the best next topic for the provided context.`;

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
