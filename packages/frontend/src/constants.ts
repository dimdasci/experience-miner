// Interview topics and questions based on POC findings

export const INTERVIEW_TOPICS = {
  RECENT_ROLE: 'recent_role_deep_dive',
  CAREER_REFLECTION: 'career_reflection',
  SKILLS_TOOLS: 'skills_and_tools',
  ACHIEVEMENTS: 'achievements_and_impact',
  PROJECTS: 'projects_and_deliverables'
} as const

export const INTERVIEW_QUESTIONS = [
  {
    id: 'recent_role_1',
    topic: INTERVIEW_TOPICS.RECENT_ROLE,
    text: 'Tell me about your most recent role. What were your primary responsibilities and how did your work impact the organization?',
    order: 1,
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