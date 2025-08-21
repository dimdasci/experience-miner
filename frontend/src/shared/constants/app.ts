// Recording constraints and limits
export const RECORDING_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
  }
}

export const MAX_RECORDING_DURATION = 600 // 10 minutes in seconds
export const MIN_RESPONSE_LENGTH = 10 // Minimum characters for a valid response