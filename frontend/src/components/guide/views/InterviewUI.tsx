import { Button } from '../../ui/button';
import GuideRecorder from '../GuideRecorder';
import { Answer } from '../../../types/business';

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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {interviewTitle}
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

      <div className="bg-white border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Q{progress.current}/{progress.total}: {currentQuestionData.question}
          </h2>
          <GuideRecorder
            questionId={String(currentQuestionData.question_number)}
            questionText={currentQuestionData.question}
            questionNumber={currentQuestionData.question_number}
            interviewId={currentQuestionData.interview_id}
            existingResponse={currentQuestionData.answer ?? undefined}
            onDataUpdate={onDataUpdate}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={saving}>
            {progress.isComplete ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewUI;
