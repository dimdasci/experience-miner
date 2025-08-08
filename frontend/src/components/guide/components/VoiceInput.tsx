import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  isActive: boolean;
  isRecording: boolean;
  recordingDuration?: number;
  isTranscribing?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

const VoiceInput = ({ 
  isActive, 
  isRecording, 
  recordingDuration = 0, 
  isTranscribing = false,
  onStartRecording, 
  onStopRecording,
  disabled = false
}: VoiceInputProps) => {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className={`
      transition-all duration-300 
      ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'} 
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
      rounded-lg p-4
    `}>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleClick}
          disabled={disabled || isTranscribing}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            ${(disabled || isTranscribing) ? 'opacity-50 cursor-not-allowed' : ''}
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

      {isTranscribing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600 mt-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Transcribing audio...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;