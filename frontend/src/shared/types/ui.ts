// UI state and recording types
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

// Import the InterviewResponse type from api.ts for InterviewState
import type { InterviewResponse } from './api'