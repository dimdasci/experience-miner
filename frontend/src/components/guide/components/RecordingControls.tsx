import { Circle, Square } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isTranscribing: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
}

const RecordingControls = ({ 
  isRecording, 
  isTranscribing, 
  recordingDuration, 
  onStartRecording 
}: RecordingControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isRecording && recordingDuration === 0) {
    // Show start recording button
    return (
      <button 
        onClick={onStartRecording}
        disabled={isTranscribing}
        className="bg-primary hover:bg-primary/90 text-surface rounded-full px-4 py-2 transition-opacity disabled:opacity-50"
        aria-label="Start recording"
      >
        <div className="flex items-center space-x-2">
          <Circle className="h-5 w-5" fill="currentColor"/>
          <span className="text-sm font-medium">Start Recording</span>
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="flex items-center bg-primary text-surface rounded-full px-4 py-2 space-x-4">
        <button 
          onClick={onStartRecording}
          disabled={isTranscribing}
          aria-label={isRecording ? "Stop recording" : "Resume recording"}
        >
          <Circle className="h-5 w-5" fill="currentColor"/>
        </button>
        <span className="tabular-nums text-lg tracking-wider">{formatTime(recordingDuration)}</span>
      </div>
      {isRecording && (
        <button 
          onClick={onStartRecording}
          className="bg-primary text-surface rounded-full p-3 hover:opacity-80 transition-opacity" 
          aria-label="Stop recording"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </button>
      )}
    </>
  );
};

export default RecordingControls;