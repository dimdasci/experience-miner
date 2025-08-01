// Shared types between frontend and backend

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

// API Response wrapper (matches backend ServiceResponse)
export interface ApiResponse<T = any> {
  success: boolean
  responseObject: T
  message: string
  statusCode: number
  error?: string
  isDuplicate?: boolean // Flag for duplicate request detection
}

// Audio recording types
export interface AudioRecording {
  blob: Blob
  duration: number
  size: number
}

export interface TranscriptionResult {
  text: string
  confidence: number
  timestamp: number
}

// UI State types
export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  volume: number
}

export interface InterviewState {
  currentQuestionIndex: number
  totalQuestions: number
  sessionId?: string
  isProcessing: boolean
  responses: InterviewResponse[]
}