import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { apiService } from '../../services/apiService';
import { Interview } from '../../types/business';
import { UserJourneyLogger } from '../../utils/logger';
import ReviewContainer from '../interview/containers/ReviewContainer';

const InterviewsScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in review mode
  const isReviewMode = !!id;

  useEffect(() => {
    // Only load interviews list when not in review mode
    if (!isReviewMode) {
      loadInterviews();
    }
  }, [isReviewMode]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getInterviews();
      
      if (response.success) {
        setInterviews(response.responseObject);
      } else {
        // Special handling for duplicate requests - don't treat as errors
        if (response.isDuplicate || response.statusCode === 429) {
          console.log('Duplicate interviews request detected - waiting for original request');
          return; // Just wait for the original request to complete
        } else {
          setError(response.message || 'Failed to load interviews');
        }
      }
    } catch (err) {
      setError('Failed to load interviews');
      // Track interviews loading errors
      UserJourneyLogger.logError(err as Error, {
        action: 'interviews_loading_failed',
        component: 'InterviewsPage'
      })
      
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const renderView = () => {
    if (isReviewMode) {
      const handleDraft = () => navigate('/interviews');
      return <ReviewContainer interviewId={id} onDraft={handleDraft} />;
    }

    // Render interviews list
    return renderInterviewsList();
  };

  const renderInterviewsList = () => {
    if (loading) {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading interviews...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Interviews
        </h1>
        <p className="text-gray-600">
          All your interview sessions in one place - both finished and in progress. You can review what you shared and update your career profile anytime.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={loadInterviews}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )} 

      <div className="space-y-4">
        {interviews.map((interview) => (
          <div key={interview.id} className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500">{formatDate(interview.updated_at)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    interview.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {interview.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {interview.title}
                </h3>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/interviews/${interview.id}/review`)}
                >
                  Review
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {interviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
          <p className="text-gray-500 mb-4">Start your first interview in the Guide section</p>
          <Button onClick={() => navigate('/guide')}>
            Start Interview
          </Button>
        </div>
      )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {renderView()}
    </div>
  );
};

export default InterviewsScreen;