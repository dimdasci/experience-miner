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
    voice,
    text,
    saving,
    activeMode,
    recordingState,
    saveAnswer
  } = interviewHook;

  // Retry loading interview (fatal load errors)
  const handleRetry = () => {
    interview.onRetry();
  };
  // Retry saving current answer (save errors)
  const handleRetrySave = async () => {
    // Re-send the current text answer from the hook
    await saveAnswer({ response: text.value, recordingDuration: 0 });
  };


  const handleNext = async () => {
    const completedId = await interview.onNext();
    if (completedId !== undefined) {
      onComplete(completedId);
    }
  };

  const handleNavigate = async (questionNumber: number) => {
    await interview.onNavigate(questionNumber - 1); // Convert to 0-based index
  };

  return (
    <InterviewUI
      interview={interview}
      voice={voice}
      text={text}
      saving={saving}
      activeMode={activeMode}
      recordingState={recordingState}
      // Use save-retry if we're mid-interview, otherwise reload interview
      onRetry={interview.currentQuestionData ? handleRetrySave : handleRetry}
      onNext={handleNext}
      onNavigate={handleNavigate}
    />
  );
};

export default InterviewSessionContainer;
