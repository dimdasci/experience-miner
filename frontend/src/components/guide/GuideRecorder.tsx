import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { apiService } from '../../services/apiService'
import { UserJourneyLogger } from '../../utils/logger'
import { useCredits } from '../../contexts/CreditsContext'

interface GuideRecorderProps {
  onDataUpdate: (data: any) => void
  questionId: string
  questionText: string
  questionNumber: number
  interviewId: number
  existingResponse?: string
}

const GuideRecorder = ({ onDataUpdate, questionId, questionText, questionNumber, interviewId, existingResponse }: GuideRecorderProps) => {
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const { refreshCredits } = useCredits()

  // Reset transcript when question changes or load existing response
  useEffect(() => {
    setTranscript(existingResponse || '')
  }, [questionId, existingResponse])

  const { 
    recordingState, 
    isSupported, 
    error, 
    startRecording, 
    stopRecording 
  } = useAudioRecorder({
    onRecordingComplete: async (recording) => {
      
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
          const transcriptText = String(result.responseObject);
            
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
            component: 'GuideRecorder',
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
            component: 'GuideRecorder',
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
        // Track transcription errors (already properly using UserJourneyLogger.logError)
        UserJourneyLogger.logError(error as Error, {
          action: 'transcription_error',
          component: 'GuideRecorder',
          questionId: questionId
        })
        
      } finally {
        setIsTranscribing(false)
      }
    }
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
        component: 'GuideRecorder',
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
        component: 'GuideRecorder',
        data: { questionId: questionId }
      })
      startRecording()
    }
  }

  const handleTranscriptEdit = () => {
    // When user manually edits transcript, update the response
    if (transcript.trim()) {
      UserJourneyLogger.logUserAction({
        action: 'transcript_manually_edited',
        component: 'GuideRecorder',
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


  const isRecording = recordingState.isRecording
  const hasTranscript = transcript.trim().length > 0

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
          onClick={handleStartRecording}
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

        {recordingState.duration > 0 && (
          <div className="text-sm text-gray-600">
            Duration: {Math.floor(recordingState.duration / 60)}:
            {String(recordingState.duration % 60).padStart(2, '0')}
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
          onChange={(e) => setTranscript(e.target.value)}
          onBlur={handleTranscriptEdit}
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

export default GuideRecorder