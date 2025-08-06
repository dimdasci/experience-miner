import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { ExtractedFacts, ProfessionalSummary } from '../../../types/business';
import { UserJourneyLogger } from '../../../utils/logger';

export function useExperienceData() {
  const [data, setData] = useState<ExtractedFacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getExperienceData();
      if (response.success) {
        const summary = response.responseObject as ProfessionalSummary;
        setData(summary.extractedFacts);
      } else if (!(response.isDuplicate || response.statusCode === 429)) {
        setError(response.message || 'Failed to load experience data');
      }
    } catch (err) {
      setError('Failed to load experience data');
      UserJourneyLogger.logError(err as Error, {
        action: 'experience_loading_failed',
        component: 'useExperienceData'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    UserJourneyLogger.logNavigation('InterviewView', 'ExperienceView');
    UserJourneyLogger.logUserAction({
      action: 'experience_view_loaded',
      component: 'ExperienceView'
    });
  }, []);

  return { data, error, loading, reload: load };
}
