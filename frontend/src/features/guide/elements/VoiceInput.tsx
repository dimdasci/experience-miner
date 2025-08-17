import { Mic, Circle, Square, Pause } from 'lucide-react';
import { useCallback, useMemo, memo, useRef, useEffect } from 'react';

interface VoiceInputProps {
  isActive: boolean;
  isRecording: boolean;
  recordingDuration?: number;
  isPaused?: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

const VoiceInput = ({ 
  isActive, 
  isRecording, 
  recordingDuration = 0, 
  isPaused = false,
  onStartRecording, 
  onPauseRecording,
  onStopRecording,
  disabled = false
}: VoiceInputProps) => {
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const wasRecording = useRef(false);
  // Focus management: move focus to stop button when recording starts
  useEffect(() => {
    if (!wasRecording.current && isRecording && stopButtonRef.current) {
      stopButtonRef.current.focus();
    }
    wasRecording.current = isRecording;
  }, [isRecording]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const stopButtonStyles = useMemo(() => {
    const isRecordingSession = isRecording || isPaused;
    
    if (!isRecordingSession) {
      return 'bg-border-subtle text-secondary';
    }
    
    return isActive ? 'bg-accent text-white' : 'bg-primary text-surface';
  }, [isRecording, isPaused, isActive]);

  const recordButtonAction = useMemo(() => {
    if (isPaused) return onPauseRecording; // Resume
    if (isRecording) return onPauseRecording; // Pause
    return onStartRecording; // Start
  }, [isPaused, isRecording, onPauseRecording, onStartRecording]);

  const recordButtonLabel = useMemo(() => {
    if (isPaused) return 'Resume recording';
    if (isRecording) return 'Pause recording';
    return 'Start recording';
  }, [isPaused, isRecording]);

  const micIcon = useMemo(
    () => <Mic className={`h-7 w-7 ${isActive ? 'text-accent' : 'text-secondary'}`} strokeWidth={1.5} />,
    [isActive]
  );

  return (
    <div className="flex items-center space-x-6">
      <div className="flex-shrink-0 w-7 flex justify-center">
        {micIcon}
      </div>
      <div className="flex-grow">
        <div className="flex items-center space-x-4">
          <button 
            className={`flex items-center bg-primary text-surface rounded-full px-4 py-2 space-x-4 hover:opacity-90 transition-opacity disabled:opacity-50 focus-transitional-ring`}
            onClick={recordButtonAction}
            disabled={disabled}
            aria-label={recordButtonLabel}
          >
            {isRecording && !isPaused ? (
              <Pause className="h-5 w-5" fill="currentColor"/>
            ) : (
              <Circle className="h-5 w-5" fill="currentColor"/>
            )}
            <span className="tabular-nums text-lg tracking-wider">
              {formatTime(recordingDuration)}
            </span>
          </button>
          <button 
            ref={stopButtonRef}
            className={`rounded-full p-3 hover:opacity-80 transition-opacity focus-transitional-ring ${stopButtonStyles}`}
            onClick={onStopRecording}
            disabled={!isRecording && !isPaused}
            aria-label="Stop recording"
          >
            <Square className="h-4 w-4" fill="currentColor" />
          </button>
          <p className="text-sm text-secondary">
            You can pause and resume recording. Stop it to get transcript.
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(VoiceInput);