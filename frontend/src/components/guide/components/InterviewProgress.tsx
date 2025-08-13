import { memo } from 'react';
import { RecordingState, AnswerWithStatus } from '../types/recordingTypes';

interface InterviewProgressProps {
  current: number;
  total: number;
  answers: AnswerWithStatus[];
  onNavigate?: (questionNumber: number) => void;
  recordingState?: RecordingState;
}

const InterviewProgress = ({ current, total, answers, onNavigate, recordingState }: InterviewProgressProps) => {
  // Progress control disabled when recording or paused according to task requirements
  const isNavigationDisabled = recordingState?.isRecording || recordingState?.isPaused;

  const handleStepClick = (step: number) => {
    if (!isNavigationDisabled && onNavigate) {
      onNavigate(step);
    }
  };

  return (
    <div className="mt-12 flex justify-center items-center space-x-2 sm:space-x-4">
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const isCurrent = step === current;
        
        // Use pre-computed hasAnswer flag (O(1) instead of O(n) string processing)
        const questionAnswer = answers[index];
        const isAnswered = questionAnswer?.hasAnswer || false;
        
        const isClickable = !isNavigationDisabled && onNavigate;
        
        return (
          <button 
            key={step} 
            className={`w-9 h-9 rounded-full flex items-center justify-center font-medium transition-all focus-ring ${
              isCurrent 
                ? 'bg-primary text-surface' 
                : isAnswered 
                  ? 'bg-neutral-bg' 
                  : 'border border-border-subtle text-secondary'
            } ${
              isClickable 
                ? 'cursor-pointer hover:opacity-80' 
                : isNavigationDisabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : ''
            }`} 
            onClick={() => handleStepClick(step)}
            disabled={!isClickable}
            aria-current={isCurrent ? "step" : undefined} 
            aria-label={`Step ${step} of ${total}${isClickable ? ' (click to navigate)' : ''}`}
          >
            {step}
          </button>
        );
      })}
    </div>
  );
};

export default memo(InterviewProgress);