import { useState } from 'react'
import { Mic, MicOff, Send, Loader2 } from 'lucide-react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { apiService } from '../../services/apiService'
import { INTERVIEW_QUESTIONS } from '../../constants'

interface RecorderProps {
  onDataUpdate: (data: any) => void
  onSessionComplete: () => void
}

const Recorder = ({ onDataUpdate, onSessionComplete }: RecorderProps) => {
  const [transcript, setTranscript] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex] || INTERVIEW_QUESTIONS[0]

  const { 
    recordingState, 
    isSupported, 
    error, 
    startRecording, 
    stopRecording 
  } = useAudioRecorder({
    onRecordingComplete: async (recording) => {
      console.log('Recording completed, transcribing...')
      setIsTranscribing(true)
      
      try {
        const result = await apiService.transcribeAudio(recording.blob)
        if (result.success && result.responseObject?.transcript) {
          setTranscript(result.responseObject.transcript)
        } else {
          console.error('Transcription failed:', result.error)
        }
      } catch (error) {
        console.error('Transcription error:', error)
      } finally {
        setIsTranscribing(false)
      }
    }
  })

  const handleStartRecording = () => {
    if (recordingState.isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleSubmitResponse = () => {
    if (transcript.trim()) {
      onDataUpdate({
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        response: transcript,
        timestamp: new Date().toISOString(),
        edited: true
      })
      setTranscript('')
      
      // Advance to next question if available
      if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleCompleteSession = () => {
    onSessionComplete()
  }

  return (
    <div className="space-y-6">
      {/* Current Question */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h3 className="font-medium text-primary mb-2">Current Question:</h3>
        <p className="text-foreground">{currentQuestion.text}</p>
        <div className="mt-2 text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center justify-center gap-4">
        {!isSupported && (
          <div className="text-red-500 text-sm">
            Audio recording is not supported in this browser
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStartRecording}
          disabled={!isSupported || isTranscribing}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50
            ${recordingState.isRecording 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Transcribing...
            </>
          ) : recordingState.isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Recording ({recordingState.duration}s)
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </button>

        {recordingState.isRecording && (
          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(recordingState.volume * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Transcript Input */}
      <div className="space-y-2">
        <label htmlFor="transcript" className="text-sm font-medium">
          Your Response (editable transcript):
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your response will appear here, or you can type directly..."
          className="w-full min-h-[120px] p-3 border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <div className="flex gap-2">
          {currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1 && (
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Skip Question
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSubmitResponse}
            disabled={!transcript.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit Response
          </button>
          
          <button
            onClick={handleCompleteSession}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
          >
            Complete & Analyze
          </button>
        </div>
      </div>
    </div>
  )
}

export default Recorder