import { 
  ApiResponse, 
  AppErrorCode,
  InterviewSession, 
  InterviewResponse, 
  CareerFact, 
  ProcessingResult 
} from '@shared/types/api'
import { UserJourneyLogger } from '../utils/logger'
import {
  Topic,
  TopicSelectionResponse,
  Interview,
  Answer,
  UpdateAnswerRequest
} from '@shared/types/business'
import { API_ENDPOINTS } from '@shared/constants/api'
import { supabase } from '@shared/lib/supabase'

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

      // Parse the JSON response
      const data = await response.json();
      
      // Special handling for 429 status from our deduplication middleware
      if (response.status === 429) {
        // Check if this is our own deduplication middleware response
        if (data.message?.includes("Duplicate request detected")) {
          // For duplicate requests, just log a warning but don't treat as error
          if (import.meta.env.DEV) {
            console.warn('Duplicate request detected:', endpoint);
          }
          
          // Return a special response that indicates this was a duplicate
          return {
            success: false,
            responseObject: {} as T,
            message: 'Duplicate request - original is being processed',
            statusCode: 429,
            errorCode: AppErrorCode.DUPLICATE_REQUEST
          };
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      // Track API errors with full context
      UserJourneyLogger.logError(error as Error, {
        endpoint,
        method: options.method || 'GET',
        action: 'api_request_failed'
      });
      
      if (import.meta.env.DEV) {
        console.error('API request failed:', error)
      }
      return {
        success: false,
        responseObject: {} as T,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500,
        errorCode: AppErrorCode.INTERNAL_ERROR
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

  // Audio transcription (matches our backend - returns transcript as string)
  async transcribeAudio(
    audioBlob: Blob, 
    question: string, 
    interviewId: number,
    questionNumber: number,
    recordingDuration?: number
  ): Promise<ApiResponse<string>> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('question', question)
    formData.append('interviewId', interviewId.toString())
    formData.append('questionNumber', questionNumber.toString())
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
      // Track transcription errors with context
      UserJourneyLogger.logError(error as Error, {
        endpoint: '/api/interview/transcribe',
        operation: 'audio_transcription',
        action: 'transcription_failed'
      });
      
      if (import.meta.env.DEV) {
        console.error('Transcription failed:', error)
      }
      return {
        success: false,
        responseObject: '',
        message: error instanceof Error ? error.message : 'Transcription failed',
        statusCode: 500,
        errorCode: AppErrorCode.INTERNAL_ERROR
      }
    }
  }

  // Extract facts from interview and complete full workflow
  async extractInterviewData(interviewId: number): Promise<ApiResponse<any>> {
    return this.request(`/interview/${interviewId}/extract`, {
      method: 'POST',
    })
  }

  // Get user's experience data
  async getExperienceData(): Promise<ApiResponse<any>> {
    return this.request('/experience')
  }

  // Topic Management
  async getTopics(): Promise<ApiResponse<Topic[]>> {
    return this.request('/topics')
  }

  async selectTopic(topicId: string): Promise<ApiResponse<TopicSelectionResponse>> {
    return this.request(`/topics/${topicId}/select`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  // Interview Management
  async getInterviews(): Promise<ApiResponse<Interview[]>> {
    return this.request('/interview')
  }

  async getInterview(interviewId: number): Promise<ApiResponse<{ interview: Interview; answers: Answer[] }>> {
    return this.request(`/interview/${interviewId}`)
  }

  async updateAnswer(
    interviewId: number, 
    questionNumber: number, 
    data: UpdateAnswerRequest
  ): Promise<ApiResponse<Answer>> {
    return this.request(`/interview/${interviewId}/answers/${questionNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService