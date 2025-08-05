import React from 'react';
import { Button } from '../../ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Interview, Answer } from '../../../types/business';

interface ReviewUIProps {
  interview: Interview | null;
  answers: Answer[];
  loading: boolean;
  error: string | null;
  isExtracting: boolean;
  extractionError: string | null;
  onRetry: () => void;
  onDraft: () => void;
  onResume: () => void;
  onExtract: () => void;
  onClearError: () => void;
  onExport: () => void;
}

const ReviewUI: React.FC<ReviewUIProps> = ({
  interview,
  answers,
  loading,
  error,
  isExtracting,
  extractionError,
  onRetry,
  onDraft,
  onResume,
  onExtract,
  onExport,
  onClearError
}) => {
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
          <button onClick={onRetry} className="mt-2 text-red-600 hover:text-red-800 underline">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Story</h1>
        <p className="text-gray-600">Topic was "{interview.title}"</p>
        <p className="text-sm text-gray-500 mt-2">Take a look at what you shared before we organize it for you</p>
      </div>

      <div className="space-y-6">
        {answers.map(answer => (
          <div key={answer.id} className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Question {answer.question_number}</h3>
              <p className="text-gray-700 mb-4">{answer.question}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{answer.answer || 'No response recorded'}</p>
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
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-gray-500">No interview questions found</p>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center bg-gray-50 rounded-lg p-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Ready to process your responses?</h3>
          <p className="text-gray-600 text-sm">
            Extract structured insights from your interview or save as draft ({answeredQuestions.length} of {answers.length} questions answered)
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onDraft}>Save as Draft</Button>
          <Button variant="outline" onClick={onResume}>Resume Interview</Button>
          <Button variant="outline" onClick={onExport}>Export</Button>
          <Button onClick={onExtract} className="bg-green-600 hover:bg-green-700" disabled={answeredQuestions.length === 0 || isExtracting}>
            {isExtracting ? (<><Loader2 className="w-4 h-4 animate-spin mr-2"/>Processing...</>) : 'Complete & Analyze'}
          </Button>
        </div>
      </div>

      {isExtracting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"/>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Making Your Career Profile</h3>
              <p className="text-gray-600 mb-4">We're turning your story into organized career information you can actually use. Hang tight for about 2 minutes.</p>
              <div className="text-sm text-gray-500">Please don't close this window while we work</div>
            </div>
          </div>
        </div>
      )}

      {extractionError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4"/>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Error</h3>
              <p className="text-gray-600 mb-6">{extractionError}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onClearError}>Close</Button>
                <Button onClick={onExtract} className="bg-blue-600 hover:bg-blue-700">Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewUI;
