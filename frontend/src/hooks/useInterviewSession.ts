import { useState, useCallback } from 'react';

export interface SessionItem {
  questionId?: string;
  question: string;
  response: string;
  timestamp: string;
  edited?: boolean;
  questionIndex?: number;
  audioUrl?: string;
}

export const useInterviewSession = (storageKey: string = 'interviewSession') => {
  const [sessionData, setSessionData] = useState<SessionItem[]>([]);

  const loadSession = useCallback((): SessionItem[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessionData(parsed);
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Failed to load session:', error);
      return [];
    }
  }, [storageKey]);

  const addResponse = useCallback((data: SessionItem) => {
    setSessionData(prev => {
      // Check if response for this question already exists
      const existingIndex = prev.findIndex(item => 
        item.questionId === data.questionId || 
        item.questionIndex === data.questionIndex
      );
      
      let updated;
      if (existingIndex >= 0) {
        // Update existing response
        updated = [...prev];
        updated[existingIndex] = data;
      } else {
        // Add new response
        updated = [...prev, data];
      }
      
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const updateSession = useCallback((data: SessionItem[]) => {
    setSessionData(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey]);

  const clearSession = useCallback(() => {
    setSessionData([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const persistSession = useCallback(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessionData));
  }, [storageKey, sessionData]);

  return {
    sessionData,
    addResponse,
    updateSession,
    clearSession,
    persistSession,
    loadSession
  };
};

export default useInterviewSession;