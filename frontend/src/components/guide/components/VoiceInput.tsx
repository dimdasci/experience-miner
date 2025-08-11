import { Mic, Circle, Square } from 'lucide-react';

interface VoiceInputProps {
  isActive: boolean;
  isRecording: boolean;
  recordingDuration?: number;
  isTranscribing?: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

const VoiceInput = ({ 
  isActive, 
  isRecording, 
  recordingDuration = 0, 
  isTranscribing = false,
  onStartRecording, 
  onPauseRecording,
  onStopRecording,
  disabled = false
}: VoiceInputProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-6">
      <div className="flex-shrink-0 w-8 flex justify-center">
        <Mic className="h-8 w-8 text-secondary" strokeWidth={1.5} />
      </div>
      <div className="flex-grow flex items-center space-x-4">
        <div className="flex items-center bg-primary text-surface rounded-full px-4 py-2 space-x-4">
          <button 
            onClick={isRecording ? onPauseRecording : onStartRecording}
            disabled={disabled}
            aria-label={isRecording ? "Pause recording" : "Start recording"}
          >
            <Circle className="h-5 w-5" fill="currentColor"/>
          </button>
          <span className="tabular-nums text-lg tracking-wider">
            {formatTime(recordingDuration)}
          </span>
        </div>
        <button 
          className="bg-primary text-surface rounded-full p-3 hover:opacity-80 transition-opacity" 
          onClick={onStopRecording}
          disabled={!isRecording}
          aria-label="Stop recording"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </button>
        <p className="text-sm text-secondary">
          You can pause and resume recording. Stop it to get transcript.
        </p>
      </div>
    </div>
  );
};

export default VoiceInput;