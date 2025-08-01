// Business logic type definitions for Experience Miner Frontend
// These match the backend types for API compatibility

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  motivational_quote: string;
  questions: TopicQuestion[];
  status: TopicStatus;
  created_at: string;
  updated_at: string;
}

export interface TopicQuestion {
  text: string;
  order: number;
}

export type TopicStatus = "available" | "used" | "irrelevant";

export interface Interview {
  id: number;
  user_id: string;
  title: string;
  motivational_quote: string;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
}

export type InterviewStatus = "draft" | "completed";

export interface Answer {
  id: string;
  interview_id: number;
  user_id: string;
  question_number: number;
  question: string;
  answer: string | null;
  recording_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface SourceRef {
  interview_id: number;
  question_number: number;
}

export interface ProfessionalSummary {
  extractedFacts: {
    achievements: Achievement[];
    companies: Company[];
    projects: Project[];
    roles: Role[];
    skills: Skill[];
    summary: {
      basedOnInterviews: number[];
      // Keep these frontend-specific fields for UI purposes
      text?: string;
      lastUpdated?: string;
    };
    // Keep metadata for UI purposes
    metadata?: {
      totalExtractions: number;
      lastExtractionAt: string;
      creditsUsed: number;
    };
  };
}

export interface Achievement {
  description: string;
  sources: SourceRef[];
  // Keep this for backward compatibility with existing frontend components
  sourceInterviewId?: string;
  sourceQuestionNumber?: number;
  extractedAt?: string;
}

export interface Company {
  name: string;
  sources: SourceRef[];
  // Keep this for backward compatibility with existing frontend components
  sourceInterviewId?: string;
  sourceQuestionNumber?: number;
  extractedAt?: string;
}

export interface Project {
  name: string;
  description: string;
  role: string;
  company?: string;
  sources: SourceRef[];
  // Keep this for backward compatibility with existing frontend components
  sourceInterviewId?: string;
  sourceQuestionNumber?: number;
  extractedAt?: string;
}

export interface Role {
  title: string;
  company: string;
  duration: string; // flexible format
  sources: SourceRef[];
  // Keep this for backward compatibility with existing frontend components
  sourceInterviewId?: string;
  sourceQuestionNumber?: number;
  extractedAt?: string;
}

export interface Skill {
  name: string;
  category?: string; // optional: technical, leadership, etc.
  sources: SourceRef[];
  // Keep this for backward compatibility with existing frontend components
  sourceInterviewId?: string;
  sourceQuestionNumber?: number;
  extractedAt?: string;
}

// API Request/Response types
export interface TopicSelectionRequest {
  topicId: string;
}

export interface TopicSelectionResponse {
  interview: Interview;
  answers: Answer[];
}

export interface UpdateAnswerRequest {
  answer: string;
  recording_duration_seconds?: number;
}

export interface ExtractionRequest {
  interviewId: string;
}

export interface ExtractionResponse {
  interview: Interview;
  professionalSummary: ProfessionalSummary;
  creditsUsed: number;
}