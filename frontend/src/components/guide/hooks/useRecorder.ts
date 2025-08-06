import { useState, useEffect } from 'react'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'
import { apiService } from '../../../services/apiService'
import { UserJourneyLogger } from '../../../utils/logger'
import { useCredits } from '../../../contexts/CreditsContext'

interface UseRecorderProps {
  questionId: string
  questionText: string
  questionNumber: number
  interviewId: number
  existingResponse?: string
  onDataUpdate: (data: any) => void
}

export const useRecorder = ({
  questionId,
  questionText,
  questionNumber,
  interviewId,
  existingResponse,
  onDataUpdate
}: UseRecorderProps) => {
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const { refreshCredits } = useCredits()

  // Reset transcript when question changes or load existing response
  useEffect(() => {
    setTranscript(existingResponse || '')
  }, [questionId, existingResponse])

  const handleRecordingComplete = async (recording: { blob: Blob; duration: number }) => {
    // Log recording completion
    UserJourneyLogger.logInterviewProgress({
      stage: 'transcribing',
      questionId: questionId,
      duration: recording.duration
    })

    setIsTranscribing(true)

    try {
      const result = await apiService.transcribeAudio(
        recording.blob,
        questionText,
        interviewId,
        questionNumber,
        recording.duration
      )

      if (result.success && result.responseObject) {
        // Backend returns the transcript as a string directly in responseObject
        const transcriptText = String(result.responseObject)

        setTranscript(transcriptText)

        // Auto-submit the response immediately after transcription
        onDataUpdate({
          questionId: questionId,
          question: questionText,
          response: transcriptText,
          timestamp: new Date().toISOString(),
          edited: false, // Mark as not manually edited
          audioUrl: undefined
        })

        // Update credits in the global context by refreshing from the server
        refreshCredits(true)

        // Log successful transcription and auto-submission
        UserJourneyLogger.logUserAction({
          action: 'transcription_completed',
          component: 'useRecorder',
          data: {
            questionId: questionId,
            transcriptLength: transcriptText.length,
            duration: recording.duration
          }
        })
      } else {
        // Track transcription API failures
        UserJourneyLogger.logError(new Error(result.error || 'Transcription failed'), {
          action: 'transcription_api_failed',
          component: 'useRecorder',
          questionId,
          statusCode: result.statusCode
        })

        // Handle specific error types
        if (result.statusCode === 402) {
          alert('Not enough credits to process this request. Please purchase more credits.')
        } else if (result.statusCode === 409) {
          alert('Another operation is in progress, please wait and try again.')
        }

        UserJourneyLogger.logInterviewProgress({
          stage: 'error',
          questionId: questionId,
          errorMessage: result.message || 'Transcription failed',
          data: { statusCode: result.statusCode }
        })
      }
    } catch (error) {
      // Track transcription errors
      UserJourneyLogger.logError(error as Error, {
        action: 'transcription_error',
        component: 'useRecorder',
        questionId: questionId
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const {
    recordingState,
    isSupported,
    error,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete
  })

  const handleStartRecording = () => {
    if (recordingState.isRecording) {
      // Log recording stop
      UserJourneyLogger.logInterviewProgress({
        stage: 'recording',
        questionId: questionId
      })
      UserJourneyLogger.logUserAction({
        action: 'recording_stopped',
        component: 'useRecorder',
        data: { questionId: questionId }
      })
      stopRecording()
    } else {
      // Log recording start
      UserJourneyLogger.logInterviewProgress({
        stage: 'recording',
        questionId: questionId
      })
      UserJourneyLogger.logUserAction({
        action: 'recording_started',
        component: 'useRecorder',
        data: { questionId: questionId }
      })
      startRecording()
    }
  }

  const handleTranscriptEdit = (newTranscript: string) => {
    setTranscript(newTranscript)
  }

  const handleTranscriptBlur = () => {
    // When user manually edits transcript, update the response
    if (transcript.trim()) {
      UserJourneyLogger.logUserAction({
        action: 'transcript_manually_edited',
        component: 'useRecorder',
        data: {
          questionId: questionId,
          responseLength: transcript.length
        }
      })

      onDataUpdate({
        questionId: questionId,
        question: questionText,
        response: transcript,
        timestamp: new Date().toISOString(),
        edited: true,
        audioUrl: undefined
      })
    }
  }

  return {
    transcript,
    isTranscribing,
    isRecording: recordingState.isRecording,
    recordingDuration: recordingState.duration,
    isSupported,
    error,
    hasTranscript: transcript.trim().length > 0,
    handleStartRecording,
    handleTranscriptEdit,
    handleTranscriptBlur
  }
}