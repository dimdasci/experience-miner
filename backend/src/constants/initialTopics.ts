// Initial topics for new users - Based on business logic specification
// These replace the frontend hardcoded topics for the database-driven approach

export interface TopicQuestion {
	text: string;
	order: number;
}

export interface InitialTopic {
	title: string;
	motivational_quote: string;
	questions: TopicQuestion[];
}

export const INITIAL_TOPICS: InitialTopic[] = [
	{
		title: "Career Story: share your professional journey in your own words",
		motivational_quote:
			"Every professional journey has meaningful moments. Your story shows what matters most to you.",
		questions: [
			{
				text: "Tell me about your career story - however you'd like to share it. It could be how you got started, a memorable experience, or just where you are now and how you got there.",
				order: 1,
			},
			{
				text: "What's been the most interesting or unexpected part of your professional journey so far?",
				order: 2,
			},
			{
				text: "When you think about your work experiences, what has given you the most satisfaction or sense of accomplishment?",
				order: 3,
			},
			{
				text: "Tell me about something meaningful you've done outside of work - maybe volunteering, a hobby project, community involvement, or personal interest. How does that connect to who you are professionally?",
				order: 4,
			},
			{
				text: "Where do you see your story heading next? What feels like the right direction for you?",
				order: 5,
			},
		],
	},
	{
		title:
			"Career Challenges, Wins and Losses: reflect on your professional ups and downs",
		motivational_quote:
			"Professional life has ups and downs. Your experiences with both show who you are and how you handle things.",
		questions: [
			{
				text: "Can you tell me about a time when something at work (or in your career preparation) felt difficult or challenging? It could be learning something new, dealing with a tough situation, or just figuring things out.",
				order: 1,
			},
			{
				text: "What's something that went really well for you professionally - a project, accomplishment, or just something you felt good about?",
				order: 2,
			},
			{
				text: "Tell me about something that didn't go as planned or didn't work out the way you hoped. What did you learn from that experience?",
				order: 3,
			},
			{
				text: "When you face setbacks or difficulties, what helps you bounce back or keep going?",
				order: 4,
			},
			{
				text: "Based on your wins and losses so far, what feels like a smart next step or area to focus on in your career?",
				order: 5,
			},
		],
	},
	{
		title:
			"Work Impact & Contribution: explore how you add value and make a difference",
		motivational_quote:
			"Everyone contributes value in their own way. Your experiences show what you bring to the table.",
		questions: [
			{
				text: "Tell me about work you do (or have done) that you feel good about - whether that's solving problems, keeping things running smoothly, helping others, or being someone people can count on.",
				order: 1,
			},
			{
				text: "What's something you do well that makes a difference for your team, customers, or organization? It could be maintaining quality, providing support, or just being reliable at what you do.",
				order: 2,
			},
			{
				text: "What kind of work feels most satisfying to you - when do you feel like you're really adding value or doing something worthwhile?",
				order: 3,
			},
			{
				text: "Think about times when you've been helpful or dependable - at work, with family, in communities. What was that experience like for you?",
				order: 4,
			},
			{
				text: "What kind of role or contribution would feel meaningful to you going forward?",
				order: 5,
			},
		],
	},
];
