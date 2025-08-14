import { useState, useEffect, useCallback, useMemo, RefObject } from 'react';
import { apiService } from '@shared/services/apiService';
import { Interview } from '@shared/types/business';
import { UserJourneyLogger } from '@shared/utils/logger';
import { useAudioRecorder } from './useAudioRecorder';
import { useCredits } from '@shared/contexts/CreditsContext';
import { RecordingState, AnswerWithStatus } from '../types/recordingTypes';
import { TranscriptionService } from '../services/transcriptionService';
import { useAnswerPersistence } from './useAnswerPersistence';
import { useInputHandlers } from './useInputHandlers';
import { UseInterviewReturn } from '../types/interviewTypes';

export function useInterview(interviewIdStr?: string, textInputRef?: RefObject<HTMLTextAreaElement | null>): UseInterviewReturn {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<AnswerWithStatus[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recording-related state
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('voice');
  const [answerText, setAnswerText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { refreshCredits } = useCredits();

  // Answer persistence hook
  const { saving, saveAnswer, saveCurrentText } = useAnswerPersistence(
    interview,
    answers,
    currentIdx,
    answerText,
    {
      onAnswersUpdate: setAnswers,
      onError: setError
    }
  );

  const loadInterview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!interviewIdStr) {
        setError('No interview ID provided.');
        return;
      }
      const id = parseInt(interviewIdStr, 10);
      if (Number.isNaN(id)) {
        setError('Invalid interview ID format.');
        return;
      }
      const response = await apiService.getInterview(id);
      if (response.success) {
        setInterview(response.responseObject.interview);
        // Compute hasAnswer at load time
        const answersWithHasAnswer = response.responseObject.answers.map(a => ({
          ...a,
          hasAnswer: !!(a.answer?.trim().length)
        }));
        setAnswers(answersWithHasAnswer);
        setCurrentIdx(0);
      } else if (!(response.errorCode === 'DUPLICATE_REQUEST' || response.statusCode === 429)) {
        setError(response.message || 'Failed to load interview');
        UserJourneyLogger.logError(new Error(response.message), {
          action: 'interview_loading_failed',
          component: 'useInterview',
          interviewId: interviewIdStr
        });
      }
    } catch (err) {
      setError('Failed to load interview');
      UserJourneyLogger.logError(err as Error, {
        action: 'interview_loading_failed',
        component: 'useInterview',
        interviewId: interviewIdStr
      });
    } finally {
      setLoading(false);
    }
  }, [interviewIdStr]);

  const next = useCallback(async (): Promise<number | undefined> => {
    if (!interview) return undefined;
    // Save current text and wait
    const ok = await saveCurrentText();
    if (!ok) return undefined;
    // If this was the last question, signal completion
    if (currentIdx >= answers.length - 1) {
      return interview.id;
    }
    setCurrentIdx(idx => idx + 1);
    return undefined;
  }, [interview, answers.length, currentIdx, saveCurrentText]);

  // Navigation function for progress control
  const navigateToQuestion = useCallback(async (newIdx: number) => {
    // Save current text before navigating and wait
    const ok = await saveCurrentText();
    if (!ok) return;
    setCurrentIdx(newIdx);
  }, [saveCurrentText]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  // Sync answer text with current question data
  useEffect(() => {
    const currentAnswer = answers[currentIdx];
    if (currentAnswer) {
      const currentAnswerText = currentAnswer.answer || '';
      setAnswerText(currentAnswerText);
    }
  }, [currentIdx, answers]);

  // Handle recording completion and transcription
  const handleRecordingComplete = useCallback(async (recording: { blob: Blob; duration: number }) => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion || !interview) return;

    await TranscriptionService.processRecording(
      {
        recording,
        question: currentQuestion.question,
        interviewId: interview.id,
        questionNumber: currentQuestion.question_number
      },
      {
        onTranscriptionStart: () => setIsTranscribing(true),
        onTranscriptionSuccess: async (transcriptText: string, duration: number) => {
          // Append transcription to existing answer text
          const existingText = answerText.trim();
          const newText = existingText.length > 0 
            ? `${existingText}\n${transcriptText}` 
            : transcriptText;
          
          setAnswerText(newText);
          await saveAnswer({
            response: newText,
            recordingDuration: duration
          });

          // Focus text input after successful transcription
          if (textInputRef?.current) {
            textInputRef.current.focus();
            // Move cursor to end of text
            textInputRef.current.setSelectionRange(newText.length, newText.length);
          }
        },
        onTranscriptionComplete: () => setIsTranscribing(false),
        onCreditsUpdate: () => refreshCredits(true)
      }
    );
  }, [answers, currentIdx, interview, answerText, saveAnswer, refreshCredits]);

  // Initialize audio recorder
  const {
    recordingState: audioRecordingState,
    isSupported,
    error: audioError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete
  });

  // Input handlers (text and audio)
  const {
    handlePauseRecording,
    handleStopRecording,
    handleTextChange,
    handleTextBlur,
    handleTextFocus,
    handleVoiceStart
  } = useInputHandlers({
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
  });

  const currentQuestionData = answers[currentIdx];

  // Compute derived recording values
  const hasContent = useMemo(() => {
    return answerText.trim().length > 0;
  }, [answerText]);

  // Compute recording state
  const recordingState = useMemo((): RecordingState => ({
    isRecording: audioRecordingState.isRecording,
    isTranscribing,
    hasContent,
    activeMode,
    isPaused: audioRecordingState.isPaused
  }), [audioRecordingState.isRecording, audioRecordingState.isPaused, isTranscribing, hasContent, activeMode]);

  return {
    // Interview data and navigation
    interview: {
      data: interview,
      answers,
      currentQuestionData,
      loading,
      error,
      onRetry: loadInterview,
      onNext: next,
      onNavigate: navigateToQuestion
    },

    // Voice recording controls and state
    voice: {
      isTranscribing,
      isRecording: audioRecordingState.isRecording,
      isPaused: audioRecordingState.isPaused,
      duration: audioRecordingState.duration,
      isSupported,
      error: audioError,
      onStart: handleVoiceStart,
      onPause: handlePauseRecording,
      onStop: handleStopRecording
    },

    // Text input controls and state
    text: {
      value: answerText,
      onChange: handleTextChange,
      onBlur: handleTextBlur,
      onFocus: handleTextFocus
    },
    
    // Top-level frequently accessed state
    saving,
    activeMode,
    recordingState,
    saveAnswer
  };
}
