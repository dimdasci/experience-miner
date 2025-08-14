// API response types matching backend ServiceResponse structure
export enum AppErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN", 
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  DUPLICATE_REQUEST = "DUPLICATE_REQUEST",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

// Match backend ServiceResponse exactly (removes isDuplicate, error fields)
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  responseObject: T;
  statusCode: number;
  errorCode?: AppErrorCode;
}

// Legacy types from types.ts that need to be preserved
export interface InterviewSession {
  id: string
  userId?: string
  status: 'active' | 'completed' | 'processing'
  responses: InterviewResponse[]
  createdAt: string
  updatedAt: string
}

export interface InterviewResponse {
  id: string
  questionId: string
  question: string
  response: string
  audioUrl?: string
  transcript?: string
  timestamp: string
  edited: boolean
}

export interface InterviewQuestion {
  id: string
  text: string
  topic: string
  order: number
  followUp?: string[]
}

export interface CareerFact {
  id: string
  sessionId: string
  type: 'company' | 'role' | 'project' | 'skill' | 'achievement' | 'responsibility'
  title: string
  description: string
  details: Record<string, any>
  confidence: number
  sourceResponseIds: string[]
  verified: boolean
  createdAt: string
}

export interface ProcessingResult {
  sessionId: string
  facts: CareerFact[]
  summary: {
    totalResponses: number
    factsExtracted: number
    averageConfidence: number
    topics: string[]
  }
  processingTime: number
  model: string
}