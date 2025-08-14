import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { Topic } from '../../../types/business';
import { UserJourneyLogger } from '../../../utils/logger';

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiService.getTopics();
      if (response.success) {
        setTopics(response.responseObject);
      } else if (!(response.isDuplicate || response.statusCode === 429)) {
        setError(response.message || 'Failed to load topics');
      }
    } catch (err) {
      setError('Failed to load topics');
      UserJourneyLogger.logError(err as Error, {
        action: 'topics_loading_failed',
        component: 'useTopics'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  return { topics, loading, error, reload: loadTopics };
}
