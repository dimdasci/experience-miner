import InterviewUI from '../views/InterviewUI';
import { useInterview } from '../hooks/useInterview';

interface InterviewSessionContainerProps {
  interviewId?: string;
  onComplete: (interviewId: number) => void;
}

const InterviewSessionContainer = ({ interviewId, onComplete }: InterviewSessionContainerProps) => {
  const interviewHook = useInterview(interviewId);
  
  const {
    interview,
    loading,
    error,
    saving,
    currentQuestionData,
    progress,
    recordingState,
    loadInterview,
    saveAnswer,
    next,
    navigateToQuestion
  } = interviewHook;

  // Retry loading interview (fatal load errors)
  const handleRetry = () => {
    loadInterview();
  };
  // Retry saving current answer (save errors)
  const handleRetrySave = async () => {
    // Re-send the current text answer from the hook
    await saveAnswer({ response: interviewHook.textValue, recordingDuration: 0 });
  };

  const handleDataUpdate = (data: any) => {
    saveAnswer(data);
  };

  const handleNext = async () => {
    const completedId = await next();
    if (completedId !== undefined) {
      onComplete(completedId);
    }
  };

  const handleNavigate = async (questionNumber: number) => {
    await navigateToQuestion(questionNumber - 1); // Convert to 0-based index
  };

  return (
    <InterviewUI
      loading={loading}
      error={error}
      saving={saving}
      interviewTitle={interview?.title || ''}
      currentQuestionData={currentQuestionData}
      progress={progress}
      recordingState={recordingState}
      // Use save-retry if we're mid-interview, otherwise reload interview
      onRetry={currentQuestionData ? handleRetrySave : handleRetry}
      onNext={handleNext}
      onNavigate={handleNavigate}
      onDataUpdate={handleDataUpdate}
      // Pass through all recording-related props from unified hook
      interviewHook={interviewHook}
    />
  );
};

export default InterviewSessionContainer;
