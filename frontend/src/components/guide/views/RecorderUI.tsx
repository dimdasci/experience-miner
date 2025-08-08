import RecordingControls from '../components/RecordingControls';
import TranscriptionStatus from '../components/TranscriptionStatus';
import StoryTextArea from '../components/StoryTextArea';

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
      <RecordingControls 
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        recordingDuration={recordingDuration}
        onStartRecording={onStartRecording}
      />
      
      <TranscriptionStatus isTranscribing={isTranscribing} />
      
      <StoryTextArea 
        transcript={transcript}
        isTranscribing={isTranscribing}
        hasTranscript={hasTranscript}
        onTranscriptChange={onTranscriptChange}
        onTranscriptBlur={onTranscriptBlur}
      />
    </div>
  )
}

export default RecorderUI