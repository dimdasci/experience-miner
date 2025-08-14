import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@shared/services/apiService';
import { Interview, Answer } from '@shared/types/business';
import { UserJourneyLogger } from '@shared/utils/logger';
import { useCredits } from '@shared/contexts/CreditsContext';

interface UseReviewInterviewResult {
  interview?: Interview | null;
  answers: Answer[];
  loading: boolean;
  error: string | null;
  isExtracting: boolean;
  extractionError: string | null;
  loadInterview: () => void;
  extractInterview: () => Promise<boolean>;
  clearExtractionError: () => void;
}

export function useReviewInterview(interviewIdStr?: string): UseReviewInterviewResult {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const { refreshCredits } = useCredits();

  const loadInterview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setInterview(null);
      setAnswers([]);
      if (!interviewIdStr) {
        setError('No interview ID provided.');
        return;
      }
      const id = parseInt(interviewIdStr, 10);
      if (Number.isNaN(id)) {
        setError('Invalid interview ID format.');
        return;
      }
      const resp = await apiService.getInterview(id);
      if (resp.success) {
        setInterview(resp.responseObject.interview);
        setAnswers(resp.responseObject.answers);
      } else if (!(resp.errorCode === 'DUPLICATE_REQUEST' || resp.statusCode === 429)) {
        setError(resp.message || 'Failed to load interview');
        UserJourneyLogger.logError(new Error(resp.message), {
          action: 'interview_loading_failed',
          component: 'useReviewInterview',
          interviewId: interviewIdStr
        });
      }
    } catch (err) {
      setError('Failed to load interview');
      UserJourneyLogger.logError(err as Error, {
        action: 'interview_loading_failed',
        component: 'useReviewInterview',
        interviewId: interviewIdStr
      });
    } finally {
      setLoading(false);
    }
  }, [interviewIdStr]);

  const extractInterview = useCallback(async (): Promise<boolean> => {
    if (!interviewIdStr) {
      setExtractionError('No interview ID provided for extraction.');
      return false;
    }
    const id = parseInt(interviewIdStr, 10);
    if (Number.isNaN(id)) {
      setExtractionError('Invalid interview ID format.');
      return false;
    }

    UserJourneyLogger.logInterviewProgress({ stage: 'extracting', data: { interviewId: id } });
    UserJourneyLogger.logUserAction({ action: 'interview_extraction_started', component: 'useReviewInterview', data: { interviewId: id } });

    setIsExtracting(true);
    setExtractionError(null);
    try {
      const result = await apiService.extractInterviewData(id);
      if (result.success) {
        await refreshCredits(true);
        UserJourneyLogger.logInterviewProgress({ stage: 'completed' });
        UserJourneyLogger.logUserAction({ action: 'interview_extraction_completed', component: 'useReviewInterview', data: { interviewId: id } });
        return true;
      } else {
        if (result.errorCode === 'DUPLICATE_REQUEST' || result.statusCode === 429) {
          // no error
        } else if (result.statusCode === 402) {
          setExtractionError('Not enough credits to process this request.');
        } else if (result.statusCode === 409) {
          setExtractionError('Another operation is in progress, please wait.');
        } else {
          setExtractionError(result.message || 'Failed to extract data from interview');
        }
        if (!(result.errorCode === 'DUPLICATE_REQUEST' || result.statusCode === 429)) {
          UserJourneyLogger.logInterviewProgress({ stage: 'error', errorMessage: result.message, data: { statusCode: result.statusCode } });
        }
        return false;
      }
    } catch (err) {
      setExtractionError('An error occurred during extraction.');
      UserJourneyLogger.logError(err as Error, { action: 'interview_extraction_error', component: 'useReviewInterview', interviewId: interviewIdStr });
      return false;
    } finally {
      setIsExtracting(false);
    }
  }, [interviewIdStr, refreshCredits]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  const clearExtractionError = () => setExtractionError(null);

  return { interview, answers, loading, error, isExtracting, extractionError, loadInterview, extractInterview, clearExtractionError };
}
