import InterviewUI from '../views/InterviewUI';
import { useInterview } from '../hooks/useInterview';

interface InterviewSessionContainerProps {
  interviewId?: string;
  onComplete: (interviewId: number) => void;
}

const InterviewSessionContainer = ({ interviewId, onComplete }: InterviewSessionContainerProps) => {
  const {
    interview,
    loading,
    error,
    saving,
    currentQuestionData,
    progress,
    loadInterview,
    saveAnswer,
    next
  } = useInterview(interviewId);

  const handleRetry = () => {
    loadInterview();
  };

  const handleDataUpdate = (data: any) => {
    saveAnswer(data);
  };

  const handleNext = () => {
    const completedId = next();
    if (completedId !== undefined) {
      onComplete(completedId);
    }
  };

  return (
    <InterviewUI
      loading={loading}
      error={error}
      saving={saving}
      interviewTitle={interview?.title || ''}
      currentQuestionData={currentQuestionData}
      progress={progress}
      onRetry={handleRetry}
      onNext={handleNext}
      onDataUpdate={handleDataUpdate}
    />
  );
};

export default InterviewSessionContainer;
