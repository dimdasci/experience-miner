import { useCallback } from 'react';
import { UserJourneyLogger } from '../../../utils/logger';

interface UseInputHandlersProps {
  answers: any[];
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

export function useInputHandlers({
  answers,
  currentIdx,
  setAnswerText,
  setActiveMode,
  saveCurrentText,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  audioRecordingState
}: UseInputHandlersProps) {
  // Recording control handlers
  const handleStartRecording = useCallback(() => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion) return;

    // Log critical user action: recording start
    UserJourneyLogger.logUserAction({
      action: 'recording_started',
      component: 'useInterview',
      data: { questionId: String(currentQuestion.question_number) }
    });
    startRecording();
  }, [startRecording, answers, currentIdx]);

  const handlePauseRecording = useCallback(() => {
    if (audioRecordingState.isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  }, [pauseRecording, resumeRecording, audioRecordingState.isPaused]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Text input handlers
  const handleTextChange = useCallback((value: string) => {
    setAnswerText(value);
    // No auto-save - only save on navigation/blur/transcription events
  }, [setAnswerText]);

  const handleTextBlur = useCallback(async () => {
    await saveCurrentText();
  }, [saveCurrentText]);

  const handleTextFocus = useCallback(() => {
    setActiveMode('text');
  }, [setActiveMode]);

  const handleVoiceStart = useCallback(() => {
    setActiveMode('voice');
    handleStartRecording();
  }, [setActiveMode, handleStartRecording]);

  return {
    handleStartRecording,
    handlePauseRecording,
    handleStopRecording,
    handleTextChange,
    handleTextBlur,
    handleTextFocus,
    handleVoiceStart
  };
}