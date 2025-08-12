import TranscriptionStatus from '../components/TranscriptionStatus';
import ErrorMessage from '../../ui/error-message';
import VoiceInput from '../components/VoiceInput';
import TextInput from '../components/TextInput';

interface RecorderUIProps {
  voice: {
    isTranscribing: boolean;
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    isSupported: boolean;
    error: string | null;
    onStart: () => void;
    onPause: () => void;
    onStop: () => void;
  };
  text: {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => Promise<void>;
    onFocus: () => void;
  };
  activeMode: 'voice' | 'text';
  saving: boolean;
}

const RecorderUI = ({
  voice,
  text,
  activeMode,
  saving
}: RecorderUIProps) => {
  const {
    isTranscribing,
    isRecording,
    isPaused,
    duration: recordingDuration,
    isSupported,
    error,
    onStart: onStartRecording,
    onPause: onPauseRecording,
    onStop: onStopRecording
  } = voice;

  const {
    value: textValue,
    onChange: onTextChange,
    onFocus: onTextFocus,
    onBlur: onTextBlur
  } = text;
  return (
    <>
      {/* Voice section - always visible, isActive based on activeMode */}
      <div className="mt-10">
        {!isTranscribing && (
          <VoiceInput 
            isActive={activeMode === 'voice' && (isRecording || isPaused)}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            isPaused={isPaused}
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
          <ErrorMessage message="Audio recording is not supported in your browser. Please use the text input below." />
        </div>
      )}
      
      {/* Microphone error message */}
      {error && (
        <div className="mt-6">
          <ErrorMessage message={`Error accessing microphone: ${error}`} />
        </div>
      )}
      
      {/* Text section - always visible, exact same DOM structure as InterviewUI */}
      <div className="mt-10 flex items-start space-x-6 flex-grow min-h-0">
        <div className="flex-shrink-0 w-8 flex justify-center text-headline font-serif font-medium pt-5 text-secondary">A</div>
        <div className="flex-grow min-h-0 h-full">
          <TextInput 
            value={textValue}
            onChange={onTextChange}
            onFocus={onTextFocus}
            onBlur={onTextBlur}
            placeholder="Start writing your answer..."
            disabled={isRecording}
          />
          {/* Save feedback during any save operation - positioned within text section */}
          {saving && (
            <p className="text-body-sm text-secondary mt-2">Saving…</p>
          )}
        </div>
      </div>
    </>
  )
}

export default RecorderUI