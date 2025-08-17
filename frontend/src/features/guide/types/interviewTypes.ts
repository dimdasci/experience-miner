import { Interview } from '@shared/types/business';
import { RecordingState, AnswerWithStatus } from './recordingTypes';

// Voice control interface
export interface VoiceControls {
  isTranscribing: boolean;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isSupported: boolean;
  error: string | null;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

// Text input interface
export interface TextControls {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => Promise<void>;
  onFocus: () => void;
}

// Interview data and navigation interface
export interface InterviewControls {
  data: Interview | null;
  answers: AnswerWithStatus[];
  currentQuestionData?: AnswerWithStatus;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNext: () => Promise<number | undefined>;
  onNavigate: (questionNumber: number) => Promise<void>;
}

// Save answer parameters - matches useAnswerPersistence saveAnswer signature
export interface SaveAnswerParams {
  response: string;
  recordingDuration: number;
}

// Complete return type for useInterview hook
export interface UseInterviewReturn {
  interview: InterviewControls;
  voice: VoiceControls;
  text: TextControls;
  saving: boolean;
  activeMode: 'voice' | 'text';
  recordingState: RecordingState;
  saveAnswer: (params: SaveAnswerParams) => Promise<boolean>;
}

// Props for useInputHandlers hook
export interface UseInputHandlersProps {
  answers: AnswerWithStatus[];
  currentIdx: number;
  setAnswerText: (text: string) => void;
  setActiveMode: (mode: 'voice' | 'text') => void;
  saveCurrentText: () => Promise<boolean>;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  audioRecordingState: {
    isPaused: boolean;
  };
}

// Return type for useInputHandlers hook
export interface UseInputHandlersReturn {
  handleStartRecording: () => void;
  handlePauseRecording: () => void;
  handleStopRecording: () => void;
  handleTextChange: (value: string) => void;
  handleTextBlur: () => Promise<void>;
  handleTextFocus: () => void;
  handleVoiceStart: () => void;
}