import { Mic, MicOff } from 'lucide-react';

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
  return (
    <div className="flex items-center justify-center space-x-4">
      <button
        onClick={onStartRecording}
        disabled={isTranscribing}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
          ${isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        <span>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </span>
      </button>

      {recordingDuration > 0 && (
        <div className="text-sm text-gray-600">
          Duration: {Math.floor(recordingDuration / 60)}:
          {String(recordingDuration % 60).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

export default RecordingControls;