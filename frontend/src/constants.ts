// Interview topics and questions based on POC findings

export const INTERVIEW_TOPICS = {
  CAREER_OVERVIEW: 'career_overview',
  KEY_ACHIEVEMENTS: 'key_achievements', 
  CAREER_GOALS: 'career_goals',
  RECENT_ROLE: 'recent_role_deep_dive',
  CAREER_REFLECTION: 'career_reflection',
  SKILLS_TOOLS: 'skills_and_tools',
  ACHIEVEMENTS: 'achievements_and_impact',
  PROJECTS: 'projects_and_deliverables'
} as const

export const TOPIC_METADATA = {
  [INTERVIEW_TOPICS.CAREER_OVERVIEW]: {
    title: 'Career Overview',
    description: 'To provide a comprehensive summary of the candidate\'s career trajectory, highlighting key roles, industries, and transitions.'
  },
  [INTERVIEW_TOPICS.KEY_ACHIEVEMENTS]: {
    title: 'Key Achievements',
    description: 'To identify and discuss major accomplishments and successes in the candidate\'s career, emphasizing outcomes and impacts.'
  },
  [INTERVIEW_TOPICS.CAREER_GOALS]: {
    title: 'Career Goals and Aspirations', 
    description: 'To articulate short-term and long-term career goals, and the steps the candidate plans to take to achieve them.'
  }
} as const

export const INTERVIEW_QUESTIONS = [
  // Career Overview Topic
  {
    id: 'career_overview_1',
    topic: INTERVIEW_TOPICS.CAREER_OVERVIEW,
    text: 'Can you begin by describing your first job or the initial steps you took in your career? What drew you to this role or field?',
    order: 1,
    followUp: [
      'What specific aspects attracted you to this field?',
      'How did you prepare for or transition into this role?'
    ]
  },
  {
    id: 'career_overview_2',
    topic: INTERVIEW_TOPICS.CAREER_OVERVIEW,
    text: 'How has your career evolved since those early days? What key transitions or pivotal moments shaped your professional journey?',
    order: 2,
    followUp: [
      'What prompted these transitions?',
      'How did you navigate career changes?'
    ]
  },
  {
    id: 'career_overview_3',
    topic: INTERVIEW_TOPICS.CAREER_OVERVIEW,
    text: 'What industries or sectors have you worked in, and how did you navigate any changes between them?',
    order: 3,
    followUp: [
      'What skills transferred between industries?',
      'What new knowledge did you need to acquire?'
    ]
  },
  {
    id: 'career_overview_4',
    topic: INTERVIEW_TOPICS.CAREER_OVERVIEW,
    text: 'Looking back, what patterns or themes do you notice in your career choices and progressions?',
    order: 4,
    followUp: [
      'What motivates your career decisions?',
      'What consistent interests do you see?'
    ]
  },
  {
    id: 'career_overview_5',
    topic: INTERVIEW_TOPICS.CAREER_OVERVIEW,
    text: 'How would you describe your overall career trajectory to someone who doesn\'t know your background?',
    order: 5,
    followUp: [
      'What would you highlight as key milestones?',
      'How do you frame your career story?'
    ]
  },
  
  // Key Achievements Topic
  {
    id: 'key_achievements_1',
    topic: INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
    text: 'What would you consider your most significant professional achievement to date? Can you walk me through what made it special?',
    order: 6,
    followUp: [
      'What obstacles did you overcome?',
      'What was your specific contribution?'
    ]
  },
  {
    id: 'key_achievements_2',
    topic: INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
    text: 'Tell me about a time when you exceeded expectations or delivered exceptional results. What was the impact?',
    order: 7,
    followUp: [
      'How was the impact measured?',
      'What feedback did you receive?'
    ]
  },
  {
    id: 'key_achievements_3',
    topic: INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
    text: 'Have you received any notable recognition, awards, or acknowledgments in your career? What led to those?',
    order: 8,
    followUp: [
      'What specific work earned this recognition?',
      'How did this recognition impact your career?'
    ]
  },
  {
    id: 'key_achievements_4',
    topic: INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
    text: 'What project or initiative are you most proud of? What role did you play in its success?',
    order: 9,
    followUp: [
      'What challenges did you help solve?',
      'What was your leadership role?'
    ]
  },
  {
    id: 'key_achievements_5',
    topic: INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
    text: 'Can you describe a challenge you overcame that resulted in a major win for you or your organization?',
    order: 10,
    followUp: [
      'What strategies did you use?',
      'What did you learn from this experience?'
    ]
  },
  
  // Career Goals Topic
  {
    id: 'career_goals_1',
    topic: INTERVIEW_TOPICS.CAREER_GOALS,
    text: 'What are your primary short-term career goals for the next 1-2 years?',
    order: 11,
    followUp: [
      'What steps are you taking to achieve these?',
      'What resources do you need?'
    ]
  },
  {
    id: 'career_goals_2',
    topic: INTERVIEW_TOPICS.CAREER_GOALS,
    text: 'How do your short-term goals connect to your longer-term career aspirations?',
    order: 12,
    followUp: [
      'What is your 5-10 year vision?',
      'How do these goals build on each other?'
    ]
  },
  {
    id: 'career_goals_3',
    topic: INTERVIEW_TOPICS.CAREER_GOALS,
    text: 'What specific steps are you taking or planning to take to achieve these goals?',
    order: 13,
    followUp: [
      'What skills are you developing?',
      'What opportunities are you seeking?'
    ]
  },
  {
    id: 'career_goals_4',
    topic: INTERVIEW_TOPICS.CAREER_GOALS,
    text: 'Are there particular skills, experiences, or qualifications you\'re working to develop?',
    order: 14,
    followUp: [
      'How are you acquiring these skills?',
      'What timeline do you have in mind?'
    ]
  },
  {
    id: 'career_goals_5',
    topic: INTERVIEW_TOPICS.CAREER_GOALS,
    text: 'How does your ideal career path look 5-10 years from now?',
    order: 15,
    followUp: [
      'What role do you see yourself in?',
      'What impact do you want to make?'
    ]
  },

  // Legacy questions (keeping for backward compatibility)
  {
    id: 'recent_role_1',
    topic: INTERVIEW_TOPICS.RECENT_ROLE,
    text: 'Tell me about your most recent role. What were your primary responsibilities and how did your work impact the organization?',
    order: 16,
    followUp: [
      'What specific tools or technologies did you use daily?',
      'How did you measure success in this role?'
    ]
  },
  {
    id: 'recent_role_2', 
    topic: INTERVIEW_TOPICS.RECENT_ROLE,
    text: 'Walk me through a typical day or week in your most recent position. What processes did you follow?',
    order: 2,
    followUp: [
      'What systems or methodologies did you use?',
      'How did you collaborate with other teams?'
    ]
  },
  {
    id: 'projects_1',
    topic: INTERVIEW_TOPICS.PROJECTS,
    text: 'Describe the most significant project you worked on recently. What was your role and what were the outcomes?',
    order: 3,
    followUp: [
      'What challenges did you overcome?',
      'What would you do differently next time?'
    ]
  },
  {
    id: 'projects_2',
    topic: INTERVIEW_TOPICS.PROJECTS,
    text: 'Tell me about a project where you had to learn something new or use unfamiliar technology. How did you approach it?',
    order: 4,
    followUp: [
      'What resources did you use to learn?',
      'How long did it take you to become proficient?'
    ]
  },
  {
    id: 'achievements_1',
    topic: INTERVIEW_TOPICS.ACHIEVEMENTS,
    text: 'What accomplishment from your recent work are you most proud of? What made it significant?',
    order: 5,
    followUp: [
      'How did you measure the impact?',
      'What recognition did you receive?'
    ]
  },
  {
    id: 'skills_1',
    topic: INTERVIEW_TOPICS.SKILLS_TOOLS,
    text: 'What technical skills, tools, or software have you used extensively in your work? How would you rate your proficiency?',
    order: 6,
    followUp: [
      'Which ones do you enjoy working with most?',
      'Are there any you want to develop further?'
    ]
  },
  {
    id: 'career_1',
    topic: INTERVIEW_TOPICS.CAREER_REFLECTION,
    text: 'Looking at your career progression, what patterns do you see in the types of work you enjoy most?',
    order: 7,
    followUp: [
      'What motivates you in your work?',
      'What kind of environment helps you thrive?'
    ]
  },
  {
    id: 'training_1',
    topic: INTERVIEW_TOPICS.ACHIEVEMENTS,
    text: 'Have you mentored others, provided training, or shared knowledge with teammates? Tell me about that experience.',
    order: 8,
    followUp: [
      'What topics did you teach or share?',
      'How did you approach knowledge transfer?'
    ]
  }
]

export const SAFE_EXTRACTION_TOPICS = [
  'Projects and deliverables',
  'Skills and technical tools', 
  'Processes and systems used',
  'Achievements and measurable impact',
  'Training provided to others',
  'Technologies and methodologies',
  'Professional accomplishments'
] as const

export const EXCLUDED_TOPICS = [
  'Manager relationships',
  'Team conflicts',
  'Reasons for leaving jobs', 
  'Workplace trauma or sensitive topics',
  'Salary or compensation details',
  'Personal or private information'
] as const

// UI Constants
export const RECORDING_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
  }
}

export const MAX_RECORDING_DURATION = 300 // 5 minutes in seconds
export const MIN_RESPONSE_LENGTH = 10 // Minimum characters for a valid response

export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  INTERVIEW: {
    START: '/api/interview/start',
    SUBMIT_RESPONSE: '/api/interview/response',
    PROCESS: '/api/interview/process',
    GET_SESSION: '/api/interview/session',
    GET_FACTS: '/api/interview/facts'
  }
} as const