import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import GuideRecorder from './GuideRecorder';
import { apiService } from '../../services/apiService';
import { Interview, Answer } from '../../types/business';

interface InterviewSessionViewProps {
  onComplete: (interviewId: number) => void;
  interviewId?: string;
}

const InterviewSessionView = ({ onComplete, interviewId: propInterviewId }: InterviewSessionViewProps) => {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [propInterviewId]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Interview ID should always be provided from URL params
      if (!propInterviewId) {
        setError('No interview ID provided. Please start from topic selection.');
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

  // Get current question data from answers array
  const currentQuestionData = answers[currentQuestion];
  const progress = {
    current: currentQuestion + 1,
    total: answers.length,
    percentage: ((currentQuestion + 1) / answers.length) * 100,
    isComplete: currentQuestion >= answers.length - 1
  };

  const handleDataUpdate = async (data: any) => {
    if (!currentQuestionData || !interview) return;
    
    try {
      setSaving(true);
      
      const response = await apiService.updateAnswer(
        interview.id,
        currentQuestionData.question_number,
        {
          answer: data.response,
          recording_duration_seconds: data.recordingDuration
        }
      );

      if (response.success) {
        // Update local state
        setAnswers(prev => prev.map(answer => 
          answer.question_number === currentQuestionData.question_number 
            ? { ...answer, answer: data.response, recording_duration_seconds: data.recordingDuration }
            : answer
        ));
      } else {
        setError(response.message || 'Failed to save answer');
      }
    } catch (err) {
      setError('Failed to save answer');
      console.error('Error saving answer:', err);
    } finally {
      setSaving(false);
    }
  };

  // Get existing response for current question
  const getCurrentQuestionResponse = () => {
    return currentQuestionData?.answer || '';
  };

  const handleNextQuestion = () => {
    if (progress.isComplete) {
      if (interview?.id) {
        onComplete(interview.id);
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
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

  if (!interview || !currentQuestionData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-gray-600">No interview data available.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {interview.title}
          </h1>
          <div className="text-sm text-gray-500">
            Question {progress.current} of {progress.total}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Q{progress.current}/{progress.total}: {currentQuestionData.question}
          </h2>
          <p className="text-sm text-gray-600 italic">
            "{interview.motivational_quote}"
          </p>
        </div>

        <div className="space-y-6">
          <GuideRecorder 
            onDataUpdate={handleDataUpdate}
            questionId={currentQuestionData.id}
            questionText={currentQuestionData.question}
            questionNumber={currentQuestionData.question_number}
            interviewId={interview.id}
            existingResponse={getCurrentQuestionResponse()}
          />

          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0 || saving}
            >
              Previous Question
            </Button>
            
            <div className="flex items-center gap-2">
              {saving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              <Button 
                onClick={handleNextQuestion}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {progress.isComplete ? 'Complete Interview' : 'Next Question'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Session Progress</h3>
        <div className="text-sm text-gray-600">
          Question {progress.current} of {progress.total} • 
          {answers.filter(a => a.answer && a.answer.trim() !== '').length} answered
        </div>
      </div>
    </div>
  );
};

export default InterviewSessionView;