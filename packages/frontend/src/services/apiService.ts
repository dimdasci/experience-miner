import { 
  ApiResponse, 
  InterviewSession, 
  InterviewResponse, 
  CareerFact, 
  ProcessingResult 
} from '../types'
import { API_ENDPOINTS } from '../constants'

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request(API_ENDPOINTS.HEALTH)
  }

  // Interview session management
  async startInterviewSession(): Promise<ApiResponse<{ sessionId: string }>> {
    return this.request(API_ENDPOINTS.INTERVIEW.START, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async getInterviewSession(sessionId: string): Promise<ApiResponse<InterviewSession>> {
    return this.request(`${API_ENDPOINTS.INTERVIEW.GET_SESSION}/${sessionId}`)
  }

  async submitInterviewResponse(
    sessionId: string,
    response: Omit<InterviewResponse, 'id' | 'timestamp'>
  ): Promise<ApiResponse<InterviewResponse>> {
    return this.request(API_ENDPOINTS.INTERVIEW.SUBMIT_RESPONSE, {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        ...response,
      }),
    })
  }

  // Interview processing
  async processInterview(sessionId: string): Promise<ApiResponse<ProcessingResult>> {
    return this.request(API_ENDPOINTS.INTERVIEW.PROCESS, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  }

  async getExtractedFacts(sessionId: string): Promise<ApiResponse<CareerFact[]>> {
    return this.request(`${API_ENDPOINTS.INTERVIEW.GET_FACTS}/${sessionId}`)
  }

  // Audio transcription (matches our backend)
  async transcribeAudio(audioBlob: Blob): Promise<ApiResponse<{ transcript: string }>> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    try {
      const response = await fetch(`${this.baseUrl}/interview/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Transcription failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      }
    }
  }

  // Extract facts from transcript (matches our backend)
  async extractFacts(transcript: string): Promise<ApiResponse<any>> {
    return this.request('/interview/extract', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService