import RecordingControls from '../components/RecordingControls';
import TranscriptionStatus from '../components/TranscriptionStatus';
import StoryTextArea from '../components/StoryTextArea';
import ErrorMessage from '../../ui/error-message';
import { Mic } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import TextInput from '../components/TextInput';

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
      <div className="mt-10">
        <ErrorMessage 
          message="Audio recording is not supported in your browser. Please use the text input below."
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-10">
        <ErrorMessage 
          message={`Error accessing microphone: ${error}`}
        />
      </div>
    )
  }

  return (
    <div className="mt-10">
      <VoiceInput 
        isActive={isRecording}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        isTranscribing={isTranscribing}
        onStartRecording={onStartRecording}
        onStopRecording={() => {}}
        disabled={isTranscribing || !isSupported}
      />
    </div>
  )
}

export default RecorderUI