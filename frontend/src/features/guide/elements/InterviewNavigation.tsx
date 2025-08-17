import { RecordingState } from '../types/recordingTypes';
import { Button } from '@shared/components/ui/button';

interface InterviewNavigationProps {
  onNext: () => void;
  isComplete: boolean;
  disabled: boolean;
  recordingState?: RecordingState;
}

const InterviewNavigation = ({ onNext, isComplete, disabled, recordingState }: InterviewNavigationProps) => {
  // Navigation disabled when recording or transcribing according to task requirements
  const isNavigationDisabled = disabled || (recordingState?.isRecording || recordingState?.isTranscribing);
  
  // Next button is accented when TextInput has content
  const hasContent = recordingState?.hasContent || false;

  return (
    <div className="flex-shrink-0 py-6 flex justify-end items-center">
      <Button 
        variant={hasContent ? "accent" : "primary"} 
        onClick={onNext}
        disabled={isNavigationDisabled}
        className="font-semibold py-3 px-8"
      >
        {isComplete ? 'Complete' : 'Next'}
      </Button>
    </div>
  );
};

export default InterviewNavigation;