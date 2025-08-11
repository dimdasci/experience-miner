import { Answer } from '../../../types/business';

export interface RecordingState {
  isRecording: boolean
  isTranscribing: boolean
  hasContent: boolean
  activeMode: 'voice' | 'text'
  isPaused: boolean
}

export interface AnswerWithStatus extends Answer {
  hasAnswer: boolean
}