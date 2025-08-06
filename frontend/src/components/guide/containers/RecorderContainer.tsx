import RecorderUI from '../views/RecorderUI'
import { useRecorder } from '../hooks/useRecorder'

interface RecorderContainerProps {
  onDataUpdate: (data: any) => void
  questionId: string
  questionText: string
  questionNumber: number
  interviewId: number
  existingResponse?: string
}

const RecorderContainer = ({
  onDataUpdate,
  questionId,
  questionText,
  questionNumber,
  interviewId,
  existingResponse
}: RecorderContainerProps) => {
  const {
    transcript,
    isTranscribing,
    isRecording,
    recordingDuration,
    isSupported,
    error,
    hasTranscript,
    handleStartRecording,
    handleTranscriptEdit,
    handleTranscriptBlur
  } = useRecorder({
    questionId,
    questionText,
    questionNumber,
    interviewId,
    existingResponse,
    onDataUpdate
  })

  return (
    <RecorderUI
      transcript={transcript}
      isTranscribing={isTranscribing}
      isRecording={isRecording}
      recordingDuration={recordingDuration}
      isSupported={isSupported}
      error={error}
      hasTranscript={hasTranscript}
      onStartRecording={handleStartRecording}
      onTranscriptChange={handleTranscriptEdit}
      onTranscriptBlur={handleTranscriptBlur}
    />
  )
}

export default RecorderContainer