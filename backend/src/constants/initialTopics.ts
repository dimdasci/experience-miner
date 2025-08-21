// Initial topics for new users

export interface TopicQuestion {
	text: string;
	order: number;
}

export interface InitialTopic {
	title: string;
	overview: string;
	questions: TopicQuestion[];
}

export const INITIAL_TOPICS: InitialTopic[] = [
	{
		title: "My Work Timeline",
		overview:
			"We'll explore your work experience and ask about specific jobs that interest you.",
		questions: [
			{
				text: "Walk me briefly through your work experience - jobs you've had, what you did, what is on top of your mind. Please mention your employers, dates and roles so we know you better.",
				order: 1,
			},
			{
				text: "Tell me more about your current or last work situation. What does a typical day or week look like, your main responsibilities, who do you work with?",
				order: 2,
			},
			{
				text: "Choose one job you mentioned and describe it in more detail. What did you actually do there day-to-day, what was the work environment like, what tools or skills did you use?",
				order: 3,
			},
			{
				text: "What kind of work do you tend to enjoy or find easier? Is there anything about work that you consistently like or dislike across different jobs?",
				order: 4,
			},
			{
				text: "Is there anything else about your work experience that feels important to mention? Maybe something you learned, a change you made, or just something that stands out to you?",
				order: 5,
			},
		],
	},
	{
		title: "What I Do Now",
		overview:
			"We'll ask about your current or recent job - your daily tasks, work environment, and typical responsibilities.",
		questions: [
			{
				text: "Tell me about your current work situation, or your most recent job if you're between positions. What's the company, your role, and what is this job basically about?",
				order: 1,
			},
			{
				text: "Describe what you actually do during a typical day or week at this job. What are your main tasks, what does your schedule look like, what takes up most of your time?",
				order: 2,
			},
			{
				text: "Pick one aspect of your job and describe it in detail - could be a specific responsibility, a type of task you do regularly, or part of your work environment. What makes this part of your job interesting or challenging?",
				order: 3,
			},
			{
				text: "What do you like or dislike about this job? What parts feel easy or natural to you, what parts are more challenging or frustrating?",
				order: 4,
			},
			{
				text: "Is there anything else about this job that seems worth mentioning? Maybe something you've learned, a skill you use, or just something that stands out about the work?",
				order: 5,
			},
		],
	},
];
