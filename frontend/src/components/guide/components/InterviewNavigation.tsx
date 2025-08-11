import { RecordingState } from '../types/recordingTypes';

interface InterviewNavigationProps {
  onNext: () => void;
  isComplete: boolean;
  disabled: boolean;
  recordingState?: RecordingState;
}

const InterviewNavigation = ({ onNext, isComplete, disabled, recordingState }: InterviewNavigationProps) => {
  // Navigation disabled when recording or transcribing according to task requirements
  const isNavigationDisabled = disabled || (recordingState?.isRecording || recordingState?.isTranscribing);
  
  // Next button enabled when TextInput has content OR VoiceInput is active (according to task requirements)
  const hasContent = recordingState?.hasContent || false;
  const isNextEnabled = hasContent && !isNavigationDisabled;

  return (
    <div className="flex-shrink-0 py-6 flex justify-end items-center">
      <button 
        onClick={onNext}
        disabled={!isNextEnabled}
        className={`font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 ${
          hasContent 
            ? 'bg-accent hover:bg-accent-hover text-white' 
            : 'bg-primary hover:bg-primary-hover text-white'
        }`}
      >
        {isComplete ? 'Complete' : 'Next'}
      </button>
    </div>
  );
};

export default InterviewNavigation;