// API endpoints and configuration
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  INTERVIEW: {
    START: '/api/interview/start',
    SUBMIT_RESPONSE: '/api/interview/response',
    PROCESS: '/api/interview/process',
    GET_SESSION: '/api/interview/session',
    GET_FACTS: '/api/interview/facts'
  }
} as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_TIMEOUT = 10000;