import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { apiService } from '../../services/apiService';
import { Interview, Answer } from '../../types/business';
import { useCredits } from '../../contexts/CreditsContext';
import { UserJourneyLogger } from '../../utils/logger';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReviewViewProps {
  onExtract?: () => void; // Keep for compatibility, but we'll handle extraction internally
  onDraft: () => void;
  interviewId?: string;
}

const ReviewView = ({ onDraft, interviewId: propInterviewId }: ReviewViewProps) => {
  const navigate = useNavigate();
  const { updateCredits } = useCredits();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    loadInterview();
  }, [propInterviewId]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Interview ID should always be provided from URL params
      if (!propInterviewId) {
        setError('No interview ID provided. Please navigate from interview flow.');
        return;
      }
      
      const interviewId = parseInt(propInterviewId, 10);
      
      if (Number.isNaN(interviewId)) {
        setError('Invalid interview ID format.');
        return;
      }

      const response = await apiService.getInterview(interviewId);
      
      if (response.success) {
        setInterview(response.responseObject.interview);
        setAnswers(response.responseObject.answers);
      } else {
        setError(response.message || 'Failed to load interview');
      }
    } catch (err) {
      setError('Failed to load interview');
      // Track interview loading errors
      UserJourneyLogger.logError(err as Error, {
        action: 'interview_loading_failed',
        component: 'ReviewView',
        interviewId: propInterviewId
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!propInterviewId) {
      setExtractionError('No interview ID provided for extraction');
      return;
    }

    const interviewId = parseInt(propInterviewId, 10);
    if (Number.isNaN(interviewId)) {
      setExtractionError('Invalid interview ID format');
      return;
    }

    // Log extraction start
    UserJourneyLogger.logInterviewProgress({
      stage: 'extracting',
      data: { interviewId }
    });
    UserJourneyLogger.logUserAction({
      action: 'interview_extraction_started',
      component: 'ReviewView',
      data: { interviewId }
    });

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const result = await apiService.extractInterviewData(interviewId);
      
      if (result.success && result.responseObject) {
        // Update credits in the global context
        if (typeof result.responseObject.credits === 'number') {
          updateCredits(result.responseObject.credits);
        }
        
        // Log successful extraction
        UserJourneyLogger.logInterviewProgress({
          stage: 'completed',
          extractedFactsCount: Object.keys(result.responseObject.extractedFacts).length
        });
        UserJourneyLogger.logUserAction({
          action: 'interview_extraction_completed',
          component: 'ReviewView',
          data: {
            interviewId,
            remainingCredits: result.responseObject.credits,
            extractedFacts: {
              companies: result.responseObject.extractedFacts.companies?.length || 0,
              roles: result.responseObject.extractedFacts.roles?.length || 0,
              projects: result.responseObject.extractedFacts.projects?.length || 0,
              achievements: result.responseObject.extractedFacts.achievements?.length || 0,
              skills: result.responseObject.extractedFacts.skills?.length || 0
            }
          }
        });
        
        // Navigate to experience page after successful extraction
        navigate('/experience');
      } else {
        // Handle specific error types
        if (result.statusCode === 402) {
          setExtractionError('Not enough credits to process this request. Please purchase more credits.');
        } else if (result.statusCode === 409) {
          setExtractionError('Another operation is in progress, please wait and try again.');
        } else {
          setExtractionError(result.error || 'Failed to extract data from interview');
        }
        
        UserJourneyLogger.logInterviewProgress({
          stage: 'error',
          errorMessage: result.error || 'Failed to extract data',
          data: { statusCode: result.statusCode }
        });
      }
    } catch (err) {
      setExtractionError('An error occurred while processing the interview');
      // Track extraction errors (already properly using UserJourneyLogger.logError)
      UserJourneyLogger.logError(err as Error, {
        action: 'interview_extraction_error',
        interviewId
      });
      
    } finally {
      setIsExtracting(false);
    }
  };

  const handleResumeInterview = () => {
    // Navigate to interview session with current interview ID
    navigate(`/guide/interview/${propInterviewId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading interview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={loadInterview}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-gray-600">No interview data available.</div>
      </div>
    );
  }

  const answeredQuestions = answers.filter(a => a.answer && a.answer.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Your Responses
        </h1>
        <p className="text-gray-600">
          Review your answers for "{interview.title}" before processing
        </p>
        <p className="text-sm text-gray-500 mt-2 italic">
          "{interview.motivational_quote}"
        </p>
      </div>

      <div className="space-y-6">
        {answers.map((answer) => (
          <div key={answer.id} className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Question {answer.question_number}
              </h3>
              <p className="text-gray-700 mb-4">
                {answer.question}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {answer.answer || 'No response recorded'}
              </p>
              {answer.recording_duration_seconds && (
                <div className="mt-3 text-sm text-gray-500">
                  Recording duration: {answer.recording_duration_seconds} seconds
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {answers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500">No interview questions found</p>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center bg-gray-50 rounded-lg p-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            Ready to process your responses?
          </h3>
          <p className="text-gray-600 text-sm">
            Extract structured insights from your interview or save as draft ({answeredQuestions.length} of {answers.length} questions answered)
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={onDraft}
          >
            Save as Draft
          </Button>
          <Button 
            variant="outline"
            onClick={handleResumeInterview}
          >
            Resume Interview
          </Button>
          <Button 
            onClick={handleExtract}
            className="bg-green-600 hover:bg-green-700"
            disabled={answeredQuestions.length === 0 || isExtracting}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Complete & Analyze'
            )}
          </Button>
        </div>
      </div>

      {/* Extraction Modal */}
      {isExtracting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Your Interview
              </h3>
              <p className="text-gray-600 mb-4">
                Our AI is extracting and organizing your career information. This may take a few moments.
              </p>
              <div className="text-sm text-gray-500">
                Please do not close this window...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extraction Error Modal */}
      {extractionError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Error
              </h3>
              <p className="text-gray-600 mb-6">
                {extractionError}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setExtractionError(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleExtract}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewView;