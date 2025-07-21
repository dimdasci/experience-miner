import { useState, useRef, useCallback, useEffect } from 'react'
import { AudioRecording, RecordingState } from '../types'
import { RECORDING_CONSTRAINTS, MAX_RECORDING_DURATION } from '../constants'

interface UseAudioRecorderOptions {
  onRecordingComplete?: (recording: AudioRecording) => void
  onTranscriptionReceived?: (transcript: string) => void
  autoStop?: boolean
  maxDuration?: number
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}) => {
  const {
    onRecordingComplete,
    onTranscriptionReceived,
    autoStop = true,
    maxDuration = MAX_RECORDING_DURATION
  } = options

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0
  })

  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      setIsSupported(hasMediaRecorder && hasGetUserMedia)
    }
    
    checkSupport()
  }, [])

  // Volume monitoring
  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const volume = average / 255 // Normalize to 0-1

    setRecordingState(prev => ({ ...prev, volume }))
    
    if (recordingState.isRecording) {
      animationRef.current = requestAnimationFrame(monitorVolume)
    }
  }, [recordingState.isRecording])

  // Duration timer
  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setRecordingState(prev => {
        const newDuration = prev.duration + 1
        
        // Auto-stop at max duration
        if (autoStop && newDuration >= maxDuration) {
          stopRecording()
          return prev
        }
        
        return { ...prev, duration: newDuration }
      })
    }, 1000)
  }, [autoStop, maxDuration])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser')
      return
    }

    try {
      setError(null)
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(RECORDING_CONSTRAINTS)
      streamRef.current = stream

      // Set up audio context for volume monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const recording: AudioRecording = {
          blob,
          duration: recordingState.duration,
          size: blob.size
        }
        onRecordingComplete?.(recording)
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }))
      
      startTimer()
      monitorVolume()

    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to access microphone. Please check permissions.')
    }
  }, [isSupported, onRecordingComplete, recordingState.duration, startTimer, monitorVolume])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    stopTimer()
    setRecordingState(prev => ({ ...prev, isRecording: false, isPaused: false }))
  }, [stopTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      stopTimer()
      setRecordingState(prev => ({ ...prev, isPaused: true }))
    }
  }, [stopTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      startTimer()
      setRecordingState(prev => ({ ...prev, isPaused: false }))
    }
  }, [startTimer])

  const resetRecording = useCallback(() => {
    stopRecording()
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      volume: 0
    })
    setError(null)
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopTimer])

  return {
    recordingState,
    isSupported,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  }
}