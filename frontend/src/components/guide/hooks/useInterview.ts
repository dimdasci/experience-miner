import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../../../services/apiService';
import { Interview, Answer } from '../../../types/business';
import { UserJourneyLogger } from '../../../utils/logger';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useCredits } from '../../../contexts/CreditsContext';
import { RecordingState, AnswerWithStatus } from '../types/recordingTypes';

interface Progress {
  current: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

// Helper function to compute if an answer exists
const computeHasAnswer = (answer: string | null | undefined): boolean => {
  return !!(answer?.trim().length);
};

export function useInterview(interviewIdStr?: string) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<AnswerWithStatus[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Recording-related state
  const [textValue, setTextValue] = useState('');
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('voice');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { refreshCredits } = useCredits();

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
          hasAnswer: computeHasAnswer(a.answer)
        }));
        setAnswers(answersWithHasAnswer);
        setCurrentIdx(0);
      } else if (!(response.isDuplicate || response.statusCode === 429)) {
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

  const saveAnswer = useCallback(async (data: { response: string; recordingDuration: number }): Promise<boolean> => {
    if (!interview) return false;
    const questionData = answers[currentIdx];
    if (!questionData) return false;
    let success = false;
    try {
      setSaving(true);
      const resp = await apiService.updateAnswer(
        interview.id,
        questionData.question_number,
        { answer: data.response, recording_duration_seconds: data.recordingDuration }
      );
      if (resp.success) {
        // apply updated answer
        setAnswers(prev =>
          prev.map(a =>
            a.question_number === questionData.question_number
              ? { 
                  ...a, 
                  answer: data.response, 
                  recording_duration_seconds: data.recordingDuration,
                  hasAnswer: computeHasAnswer(data.response)
                }
              : a
          )
        );
        // clear any previous save error
        setError(null);
        success = true;
      } else if (!(resp.isDuplicate || resp.statusCode === 429)) {
        setError(resp.message || 'Failed to save answer');
        UserJourneyLogger.logError(new Error(resp.message), {
          action: 'answer_save_failed',
          component: 'useInterview',
          questionNumber: questionData.question_number
        });
      }
    } catch (err) {
      setError('Failed to save answer');
      UserJourneyLogger.logError(err as Error, {
        action: 'answer_save_failed',
        component: 'useInterview',
        questionNumber: questionData.question_number
      });
    } finally {
      setSaving(false);
    }
    return success;
  }, [interview, answers, currentIdx]);

  // Save current text if it has changed - returns success
  const saveCurrentText = useCallback(async (): Promise<boolean> => {
    const currentAnswer = answers[currentIdx];
    if (currentAnswer && textValue !== (currentAnswer.answer || '')) {
      const ok = await saveAnswer({
        response: textValue,
        recordingDuration: 0
      });
      return ok;
    }
    return true;
  }, [textValue, answers, currentIdx, saveAnswer]);

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

  // Sync text value and transcript with current question data
  useEffect(() => {
    const currentAnswer = answers[currentIdx];
    if (currentAnswer) {
      const answerText = currentAnswer.answer || '';
      setTextValue(answerText);
      setTranscript(answerText);
    }
  }, [currentIdx, answers]);

  // Handle recording completion and transcription
  const handleRecordingComplete = useCallback(async (recording: { blob: Blob; duration: number }) => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion || !interview) return;

    // Log recording completion
    UserJourneyLogger.logInterviewProgress({
      stage: 'transcribing',
      questionId: String(currentQuestion.question_number),
      duration: recording.duration
    });

    setIsTranscribing(true);

    try {
      const result = await apiService.transcribeAudio(
        recording.blob,
        currentQuestion.question,
        interview.id,
        currentQuestion.question_number,
        recording.duration
      );

      if (result.success && result.responseObject) {
        // Backend returns the transcript as a string directly in responseObject
        const transcriptText = String(result.responseObject);
        
        setTranscript(transcriptText);
        setTextValue(transcriptText);

        // Auto-submit the response immediately after transcription
        await saveAnswer({
          response: transcriptText,
          recordingDuration: recording.duration
        });

        // Update credits in the global context by refreshing from the server
        refreshCredits(true);

        // Log successful transcription and auto-submission
        UserJourneyLogger.logUserAction({
          action: 'transcription_completed',
          component: 'useInterview',
          data: {
            questionId: String(currentQuestion.question_number),
            transcriptLength: transcriptText.length,
            duration: recording.duration
          }
        });
      } else {
        // Track transcription API failures
        UserJourneyLogger.logError(new Error(result.error || 'Transcription failed'), {
          action: 'transcription_api_failed',
          component: 'useInterview',
          questionId: String(currentQuestion.question_number),
          statusCode: result.statusCode
        });

        // Handle specific error types
        if (result.statusCode === 402) {
          alert('Not enough credits to process this request. Please purchase more credits.');
        } else if (result.statusCode === 409) {
          alert('Another operation is in progress, please wait and try again.');
        }

        UserJourneyLogger.logInterviewProgress({
          stage: 'error',
          questionId: String(currentQuestion.question_number),
          errorMessage: result.message || 'Transcription failed',
          data: { statusCode: result.statusCode }
        });
      }
    } catch (error) {
      // Track transcription errors
      UserJourneyLogger.logError(error as Error, {
        action: 'transcription_error',
        component: 'useInterview',
        questionId: String(currentQuestion.question_number)
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [answers, currentIdx, interview, saveAnswer, refreshCredits]);

  // Initialize audio recorder
  const {
    recordingState: audioRecordingState,
    isSupported,
    error: audioError,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete
  });

  // Recording control handlers
  const handleStartRecording = useCallback(() => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion) return;

    // Log recording start
    UserJourneyLogger.logInterviewProgress({
      stage: 'recording',
      questionId: String(currentQuestion.question_number)
    });
    UserJourneyLogger.logUserAction({
      action: 'recording_started',
      component: 'useInterview',
      data: { questionId: String(currentQuestion.question_number) }
    });
    startRecording();
  }, [startRecording, answers, currentIdx]);

  const handlePauseRecording = useCallback(() => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion) return;

    // Log recording pause
    UserJourneyLogger.logInterviewProgress({
      stage: 'recording',
      questionId: String(currentQuestion.question_number)
    });
    UserJourneyLogger.logUserAction({
      action: 'recording_paused',
      component: 'useInterview',
      data: { questionId: String(currentQuestion.question_number) }
    });
    stopRecording();
  }, [stopRecording, answers, currentIdx]);

  const handleStopRecording = useCallback(() => {
    const currentQuestion = answers[currentIdx];
    if (!currentQuestion) return;

    // Log recording stop
    UserJourneyLogger.logInterviewProgress({
      stage: 'recording',
      questionId: String(currentQuestion.question_number)
    });
    UserJourneyLogger.logUserAction({
      action: 'recording_stopped',
      component: 'useInterview',
      data: { questionId: String(currentQuestion.question_number) }
    });
    stopRecording();
  }, [stopRecording, answers, currentIdx]);

  // Text input handlers
  const handleTextChange = useCallback((value: string) => {
    setTextValue(value);
    // No auto-save - only save on navigation/blur/transcription events
  }, []);

  const handleTextBlur = useCallback(async () => {
    await saveCurrentText();
  }, [saveCurrentText]);

  const handleTextFocus = useCallback(() => {
    setActiveMode('text');
  }, []);

  const handleVoiceStart = useCallback(() => {
    setActiveMode('voice');
    handleStartRecording();
  }, [handleStartRecording]);

  const currentQuestionData = answers[currentIdx];
  const total = answers.length;
  const progress: Progress = {
    current: currentIdx + 1,
    total,
    percentage: total > 0 ? ((currentIdx + 1) / total) * 100 : 0,
    isComplete: currentIdx >= total - 1
  };

  // Compute derived recording values
  const hasContent = useMemo(() => {
    return textValue.trim().length > 0 || transcript.trim().length > 0;
  }, [textValue, transcript]);

  const hasTranscript = transcript.trim().length > 0;

  // Compute recording state
  const recordingState = useMemo((): RecordingState => ({
    isRecording: audioRecordingState.isRecording,
    isTranscribing,
    hasContent,
    activeMode,
    isPaused: false // TODO: Add pause functionality
  }), [audioRecordingState.isRecording, isTranscribing, hasContent, activeMode]);

  return {
    interview,
    answers,
    loading,
    error,
    saving,
    currentQuestionData,
    progress,
    recordingState,
    loadInterview,
    saveAnswer,
    next,
    navigateToQuestion,
    // Recording-related returns
    transcript,
    textValue,
    isTranscribing,
    isRecording: audioRecordingState.isRecording,
    recordingDuration: audioRecordingState.duration,
    isSupported,
    audioError,
    hasTranscript,
    activeMode,
    handleStartRecording,
    handlePauseRecording,
    handleStopRecording,
    handleTextChange,
    handleTextBlur,
    handleTextFocus,
    handleVoiceStart
  };
}
