import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { apiService } from '../../services/apiService';
import { Interview, Answer } from '../../types/business';

interface ReviewViewProps {
  onExtract: () => void;
  onDraft: () => void;
  interviewId?: string;
}

const ReviewView = ({ onExtract, onDraft, interviewId: propInterviewId }: ReviewViewProps) => {
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      console.error('Error loading interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = () => {
    onExtract();
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
            disabled={answeredQuestions.length === 0}
          >
            Complete & Analyze
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewView;