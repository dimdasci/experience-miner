import { useCallback, useState } from 'react';
import { apiService } from '../../../services/apiService';
import { UserJourneyLogger } from '../../../utils/logger';
import { Interview } from '../../../types/business';
import { AnswerWithStatus } from '../types/recordingTypes';

// Helper function to compute if an answer exists
const computeHasAnswer = (answer: string | null | undefined): boolean => {
  return !!(answer?.trim().length);
};

interface AnswerPersistenceCallbacks {
  onAnswersUpdate: (updater: (prev: AnswerWithStatus[]) => AnswerWithStatus[]) => void;
  onError: (error: string | null) => void;
}

export function useAnswerPersistence(
  interview: Interview | null,
  answers: AnswerWithStatus[],
  currentIdx: number,
  answerText: string,
  callbacks: AnswerPersistenceCallbacks
) {
  const [saving, setSaving] = useState(false);

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
        callbacks.onAnswersUpdate(prev =>
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
        callbacks.onError(null);
        success = true;
      } else if (!(resp.isDuplicate || resp.statusCode === 429)) {
        callbacks.onError(resp.message || 'Failed to save answer');
        UserJourneyLogger.logError(new Error(resp.message), {
          action: 'answer_save_failed',
          component: 'useAnswerPersistence',
          questionNumber: questionData.question_number
        });
      }
    } catch (err) {
      callbacks.onError('Failed to save answer');
      UserJourneyLogger.logError(err as Error, {
        action: 'answer_save_failed',
        component: 'useAnswerPersistence',
        questionNumber: questionData.question_number
      });
    } finally {
      setSaving(false);
    }
    return success;
  }, [interview, answers, currentIdx, callbacks]);

  // Save current text if it has changed - returns success
  const saveCurrentText = useCallback(async (): Promise<boolean> => {
    const currentAnswer = answers[currentIdx];
    if (currentAnswer && answerText !== (currentAnswer.answer || '')) {
      const ok = await saveAnswer({
        response: answerText,
        recordingDuration: 0
      });
      return ok;
    }
    return true;
  }, [answerText, answers, currentIdx, saveAnswer]);

  return {
    saving,
    saveAnswer,
    saveCurrentText
  };
}