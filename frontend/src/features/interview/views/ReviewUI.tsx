import { Interview, Answer } from '@shared/types/business';
import SectionHeader from '@shared/components/ui/section-header';
import ReviewAnswersList from '../elements/ReviewAnswersList';
import ReviewAnswer from '../elements/ReviewAnswer';
import ReviewNavigation from '../elements/ReviewNavigation';
import ProcessingModal from '@shared/components/modals/ProcessingModal';
import { Button } from '@shared/components/ui/button';
import { MIN_RESPONSE_LENGTH } from '@shared/constants/app';

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
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary">Loading interview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="text-accent">{error}</div>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-secondary">No interview data available.</div>
      </div>
    );
  }

  const answeredQuestions = answers.filter(a => a.answer && a.answer.trim() !== '');
  const hasMinimumContent = answeredQuestions.some(a => a.answer && a.answer.trim().length >= MIN_RESPONSE_LENGTH);

  return (
    <>
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <SectionHeader 
          title={interview.title} 
          subtitle="Review Your story"
        />
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      {/* Scrollable Content */}
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
        <ReviewAnswersList>
          {answers.map((answer, index) => (
            <ReviewAnswer 
              key={answer.id} 
              questionNumber={answer.question_number}
              question={answer.question} 
              answer={answer.answer}
              recordingDuration={answer.recording_duration_seconds}
              isFirst={index === 0}
            />
          ))}
        </ReviewAnswersList>

        {answers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-secondary mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-secondary">No interview questions found</p>
          </div>
        )}
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      {/* Navigation - part of main content flow like InterviewNavigation */}
      <ReviewNavigation 
        onDraft={onDraft} 
        onResume={onResume}
        onExport={onExport} 
        onExtract={onExtract}
        answeredCount={answeredQuestions.length}
        totalCount={answers.length}
        isExtracting={isExtracting}
        hasMinimumContent={hasMinimumContent}
      />

      <ProcessingModal 
        isProcessing={isExtracting}
        error={extractionError}
        onRetry={onExtract}
        onCancel={onClearError}
      />
    </>
  );
};

export default ReviewUI;
