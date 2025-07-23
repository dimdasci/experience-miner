import { 
  ApiResponse, 
  InterviewSession, 
  InterviewResponse, 
  CareerFact, 
  ProcessingResult 
} from '../types'
import { API_ENDPOINTS } from '../constants'
import { supabase } from '../lib/supabase'

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          ...authHeaders,
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
      if (import.meta.env.DEV) {
        console.error('API request failed:', error)
      }
      return {
        success: false,
        responseObject: {} as T,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500,
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

  // Get user credits
  async getCredits(): Promise<ApiResponse<{ credits: number }>> {
    return this.request('/credits')
  }

  // Audio transcription (matches our backend)
  async transcribeAudio(
    audioBlob: Blob, 
    question: string, 
    interviewId: number,
    recordingDuration?: number
  ): Promise<ApiResponse<{ transcript: string; credits: number }>> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('question', question)
    formData.append('interviewId', interviewId.toString())
    if (recordingDuration !== undefined) {
      formData.append('recordingDuration', recordingDuration.toString())
    }

    try {
      // Get auth token for FormData requests
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.baseUrl}/interview/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Transcription failed:', error)
      }
      return {
        success: false,
        responseObject: { transcript: '', credits: 0 },
        message: error instanceof Error ? error.message : 'Transcription failed',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Transcription failed'
      }
    }
  }

  // Extract facts from transcript (matches our backend)
  async extractFacts(
    transcript: string, 
    question: string, 
    interviewId: number
  ): Promise<ApiResponse<any>> {
    return this.request('/interview/extract', {
      method: 'POST',
      body: JSON.stringify({ transcript, question, interviewId }),
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService