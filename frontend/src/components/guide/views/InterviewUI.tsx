import RecorderContainer from '../containers/RecorderContainer';
import { Answer } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import InterviewProgress from '../components/InterviewProgress';
import QuestionAnswerPair from '../components/QuestionAnswerPair';
import FocusedQuestion from '../components/FocusedQuestion';
import InterviewNavigation from '../components/InterviewNavigation';

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

  if (!currentQuestionData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-gray-600">No interview data available.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader 
        title={interviewTitle}
        className="mb-6"
      />
      
      <InterviewProgress 
        current={progress.current} 
        total={progress.total} 
        percentage={progress.percentage} 
      />
      
      <QuestionAnswerPair>
        <FocusedQuestion 
          question={currentQuestionData.question} 
          number={progress.current}
          total={progress.total}
        />
        <RecorderContainer
          questionId={String(currentQuestionData.question_number)}
          questionText={currentQuestionData.question}
          questionNumber={currentQuestionData.question_number}
          interviewId={currentQuestionData.interview_id}
          existingResponse={currentQuestionData.answer ?? undefined}
          onDataUpdate={onDataUpdate}
        />
      </QuestionAnswerPair>
      
      <InterviewNavigation 
        onNext={onNext} 
        isComplete={progress.isComplete} 
        disabled={saving} 
      />
    </div>
  );
};

export default InterviewUI;
