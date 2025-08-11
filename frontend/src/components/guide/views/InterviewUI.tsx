import RecorderContainer from '../containers/RecorderContainer';
import { Answer } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import InterviewProgress from '../components/InterviewProgress';
import QuestionAnswerPair from '../components/QuestionAnswerPair';
import FocusedQuestion from '../components/FocusedQuestion';
import InterviewNavigation from '../components/InterviewNavigation';
import TextInput from '../components/TextInput';
import ErrorMessage from '../../ui/error-message';

interface Progress {
  current: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

interface InterviewUIProps {
  loading: boolean;
  error: string | null;
  saving: boolean;
  interviewTitle: string;
  currentQuestionData?: Answer;
  progress: Progress;
  onRetry: () => void;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
}

const InterviewUI = ({
  loading,
  error,
  saving,
  interviewTitle,
  currentQuestionData,
  progress,
  onRetry,
  onNext,
  onDataUpdate
}: InterviewUIProps) => {
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary">Loading interview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage 
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-secondary">No interview data available.</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with proper spacing */}
      <div className="flex-shrink-0">
        <SectionHeader
          title={interviewTitle}
          subtitle="Track your progress through the interview process."
        />
        
        <InterviewProgress 
          current={progress.current} 
          total={progress.total} 
          percentage={progress.percentage} 
        />
      </div>
      
      {/* Q&A Section that fills available space */}
      <div className="flex flex-col flex-grow min-h-0 pb-10">
        {/* Question */}
        <FocusedQuestion 
          question={currentQuestionData.question} 
          number={progress.current}
          total={progress.total}
        />
        
        {/* Recorder */}
        <RecorderContainer
          questionId={String(currentQuestionData.question_number)}
          questionText={currentQuestionData.question}
          questionNumber={currentQuestionData.question_number}
          interviewId={currentQuestionData.interview_id}
          existingResponse={currentQuestionData.answer ?? undefined}
          onDataUpdate={onDataUpdate}
        />
        
        {/* Answer - grows to fill remaining space */}
        <div className="mt-10 flex items-start space-x-6 flex-grow min-h-0">
          <div className="flex-shrink-0 w-8 flex justify-center text-headline font-serif font-medium text-secondary">A</div>
          <div className="flex-grow min-h-0 h-full rounded-lg bg-surface transition-shadow duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background focus-within:ring-accent">
            <TextInput 
              isActive={true}
              value={currentQuestionData.answer ?? ''}
              onChange={() => {}}
              onFocus={() => {}}
              placeholder="Start writing your answer..."
              disabled={false}
            />
          </div>
        </div>
      </div>
      
      {/* Navigation at bottom */}
      <InterviewNavigation 
        onNext={onNext} 
        isComplete={progress.isComplete} 
        disabled={saving} 
      />
    </>

  );
};

export default InterviewUI;
