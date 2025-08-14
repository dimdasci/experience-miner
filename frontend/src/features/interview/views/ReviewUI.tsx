import { Interview, Answer } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import ReviewAnswersList from '../components/ReviewAnswersList';
import ReviewAnswer from '../components/ReviewAnswer';
import ReviewNavigation from '../components/ReviewNavigation';
import ProcessingModal from '../../guide/components/ProcessingModal';
import { Button } from '../../ui/button';

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

const ReviewUI = ({
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
}: ReviewUIProps) => {
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
        <div className="p-4 bg-accent border border-accent rounded-lg">
          <div className="text-surface">{error}</div>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try again
          </Button>
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
      <SectionHeader 
        title="Review Your Story" 
        subtitle={`Topic was "${interview.title}" - Take a look at what you shared before we organize it for you`}
      />

      <ReviewAnswersList>
        {answers.map(answer => (
          <ReviewAnswer 
            key={answer.id} 
            questionNumber={answer.question_number}
            question={answer.question} 
            answer={answer.answer}
            recordingDuration={answer.recording_duration_seconds}
          />
        ))}
      </ReviewAnswersList>

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

      <ReviewNavigation 
        onDraft={onDraft} 
        onResume={onResume}
        onExport={onExport} 
        onExtract={onExtract}
        answeredCount={answeredQuestions.length}
        totalCount={answers.length}
        isExtracting={isExtracting}
      />

      <ProcessingModal 
        isProcessing={isExtracting}
        error={extractionError}
        onRetry={onExtract}
        onCancel={onClearError}
      />
    </div>
  );
};

export default ReviewUI;
