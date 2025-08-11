import TranscriptionStatus from '../components/TranscriptionStatus';
import ErrorMessage from '../../ui/error-message';
import VoiceInput from '../components/VoiceInput';
import TextInput from '../components/TextInput';

interface RecorderUIProps {
  // Voice props
  transcript: string
  isTranscribing: boolean
  isRecording: boolean
  recordingDuration: number
  isSupported: boolean
  error: string | null
  hasTranscript: boolean
  onStartRecording: () => void
  onPauseRecording: () => void
  onStopRecording: () => void
  onTranscriptChange: (value: string) => void
  onTranscriptBlur: () => void
  // Text props
  textValue: string
  onTextChange: (value: string) => void
  onTextFocus: () => void
  onTextBlur: () => void
  // State props
  activeMode: 'voice' | 'text'
}

const RecorderUI = ({
  // Voice props
  transcript,
  isTranscribing,
  isRecording,
  recordingDuration,
  isSupported,
  error,
  hasTranscript,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  onTranscriptChange,
  onTranscriptBlur,
  // Text props
  textValue,
  onTextChange,
  onTextFocus,
  onTextBlur,
  // State props
  activeMode
}: RecorderUIProps) => {
  return (
    <>
      {/* Voice section - always visible, isActive based on activeMode */}
      <div className="mt-10">
        {!isTranscribing && (
          <VoiceInput 
            isActive={activeMode === 'voice' && (isRecording || hasTranscript)}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            isTranscribing={isTranscribing}
            onStartRecording={onStartRecording}
            onPauseRecording={onPauseRecording}
            onStopRecording={onStopRecording}
            disabled={isTranscribing || !isSupported}
          />
        )}
        
        {/* TranscriptionStatus replaces VoiceInput during transcription */}
        {isTranscribing && (
          <TranscriptionStatus isTranscribing={isTranscribing} />
        )}
      </div>
      
      {/* Audio not supported message */}
      {!isSupported && (
        <div className="mt-6">
          <ErrorMessage 
            message="Audio recording is not supported in your browser. Please use the text input below."
          />
        </div>
      )}
      
      {/* Microphone error message */}
      {error && (
        <div className="mt-6">
          <ErrorMessage 
            message={`Error accessing microphone: ${error}`}
          />
        </div>
      )}
      
      {/* Text section - always visible, exact same DOM structure as InterviewUI */}
      <div className="mt-10 flex items-start space-x-6 flex-grow min-h-0">
        <div className="flex-shrink-0 w-8 flex justify-center text-headline font-serif font-medium text-secondary">A</div>
        <div className="flex-grow min-h-0 h-full">
          <TextInput 
            isActive={activeMode === 'text'}
            value={textValue}
            onChange={onTextChange}
            onFocus={onTextFocus}
            onBlur={onTextBlur}
            placeholder="Start writing your answer..."
            disabled={isRecording}
          />
        </div>
      </div>
    </>
  )
}

export default RecorderUI