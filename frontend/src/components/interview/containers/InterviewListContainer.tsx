import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { Interview } from '../../../types/business';
import { UserJourneyLogger } from '../../../utils/logger';
import InterviewList from '../components/InterviewList';

const InterviewListContainer = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getInterviews();
      
      if (response.success) {
        setInterviews(response.responseObject);
      } else {
        if (response.isDuplicate || response.statusCode === 429) {
          console.log('Duplicate interviews request detected - waiting for original request');
          return;
        } else {
          setError(response.message || 'Failed to load interviews');
        }
      }
    } catch (err) {
      setError('Failed to load interviews');
      UserJourneyLogger.logError(err as Error, {
        action: 'interviews_loading_failed',
        component: 'InterviewListContainer'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInterview = (interview: Interview) => {
    navigate(`/interviews/${interview.id}/review`);
  };

  const handleStartInterview = () => {
    navigate('/guide');
  };

  return (
    <InterviewList 
      interviews={interviews}
      loading={loading}
      error={error}
      onSelectInterview={handleSelectInterview}
      onRetry={loadInterviews}
      onStartInterview={handleStartInterview}
    />
  );
};

export default InterviewListContainer;