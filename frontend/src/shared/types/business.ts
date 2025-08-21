// Business logic type definitions for Experience Miner Frontend
// These match the backend types for API compatibility

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  overview: string;
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
  overview: string;
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

export interface Project {
  name: string;
  goal: string;
  achievements: string[];
}

export interface Role {
  title: string;
  company: string;
  start_year: string;
  end_year: string;
  experience: string;
  projects: Project[];
  skills: string[];
  sources: SourceRef[];
}

export interface ExtractedFacts {
  summary: {
    text: string;
    basedOnInterviews: number[];
  };
  roles: Role[];
}

export interface ProfessionalSummary {
  extractedFacts: ExtractedFacts;
  // Keep metadata for UI purposes
  metadata?: {
    totalExtractions: number;
    lastExtractionAt: string;
    creditsUsed: number;
  };
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