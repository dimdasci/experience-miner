import { Interview, Answer } from '@shared/types/business';
import SectionHeader from '@shared/components/ui/section-header';
import ReviewAnswersList from '../elements/ReviewAnswersList';
import ReviewAnswer from '../elements/ReviewAnswer';
import ReviewNavigation from '../elements/ReviewNavigation';
import ProcessingModal from '@shared/components/modals/ProcessingModal';
import { MIN_RESPONSE_LENGTH } from '@shared/constants/app';
import ErrorMessage from '@shared/components/ui/error-message';
import { AlertTriangle } from 'lucide-react';

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
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary">Loading interview...</div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-3xl mx-auto p-6">
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
        {error && (
          <div className="mt-12">
            <ErrorMessage 
              message={error}
              onRetry={onRetry}
            />
          </div>
        )}
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      {/* Scrollable Content */}
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
        <ReviewAnswersList>
          {answers.map((answer) => (
            <ReviewAnswer 
              key={answer.id} 
              questionNumber={answer.question_number}
              question={answer.question} 
              answer={answer.answer}
              recordingDuration={answer.recording_duration_seconds}
            />
          ))}
        </ReviewAnswersList>

        {answers.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-secondary mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
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
