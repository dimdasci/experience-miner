import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { Interview, Answer } from '../../../types/business';
import { UserJourneyLogger } from '../../../utils/logger';

interface Progress {
  current: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export function useInterview(interviewIdStr?: string) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        setAnswers(response.responseObject.answers);
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

  const saveAnswer = useCallback(async (data: { response: string; recordingDuration: number }) => {
    if (!interview) return;
    const questionData = answers[currentIdx];
    if (!questionData) return;
    try {
      setSaving(true);
      const resp = await apiService.updateAnswer(
        interview.id,
        questionData.question_number,
        { answer: data.response, recording_duration_seconds: data.recordingDuration }
      );
      if (resp.success) {
        setAnswers(prev =>
          prev.map(a =>
            a.question_number === questionData.question_number
              ? { ...a, answer: data.response, recording_duration_seconds: data.recordingDuration }
              : a
          )
        );
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
  }, [interview, answers, currentIdx]);

  const next = useCallback((): number | undefined => {
    if (!interview) return undefined;
    if (currentIdx >= answers.length - 1) {
      return interview.id;
    }
    setCurrentIdx(idx => idx + 1);
    return undefined;
  }, [interview, answers.length, currentIdx]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  const currentQuestionData = answers[currentIdx];
  const total = answers.length;
  const progress: Progress = {
    current: currentIdx + 1,
    total,
    percentage: total > 0 ? ((currentIdx + 1) / total) * 100 : 0,
    isComplete: currentIdx >= total - 1
  };

  return {
    interview,
    loading,
    error,
    saving,
    currentQuestionData,
    progress,
    loadInterview,
    saveAnswer,
    next
  };
}
