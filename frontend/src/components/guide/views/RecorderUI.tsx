import { Mic, MicOff, Loader2 } from 'lucide-react'

interface RecorderUIProps {
  transcript: string
  isTranscribing: boolean
  isRecording: boolean
  recordingDuration: number
  isSupported: boolean
  error: string | null
  hasTranscript: boolean
  onStartRecording: () => void
  onTranscriptChange: (value: string) => void
  onTranscriptBlur: () => void
}

const RecorderUI = ({
  transcript,
  isTranscribing,
  isRecording,
  recordingDuration,
  isSupported,
  error,
  hasTranscript,
  onStartRecording,
  onTranscriptChange,
  onTranscriptBlur
}: RecorderUIProps) => {
  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Audio recording is not supported in your browser. Please use the text input below.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          Error accessing microphone: {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
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

      {/* Transcription Status */}
      {isTranscribing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Transcribing audio...</span>
        </div>
      )}

      {/* Text Input/Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your Story:
        </label>
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          onBlur={onTranscriptBlur}
          placeholder="Record your answer or type here"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
          disabled={isTranscribing}
        />
        {hasTranscript && (
          <p className="text-xs text-gray-500">
            Story saved. Use navigation buttons below to continue.
          </p>
        )}
      </div>
    </div>
  )
}

export default RecorderUI