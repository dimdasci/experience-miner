import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { UserJourneyLogger } from '../utils/logger';

interface CreditsContextType {
  credits: number | null;
  loading: boolean;
  error: string | null;
  fetchCredits: () => Promise<number | null>;
  refreshCredits: (force?: boolean) => Promise<number | null>;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Fetch credits from the API
  const fetchCredits = useCallback(async (): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCredits();
      
      if (response.success) {
        const newCredits = response.responseObject.credits;
        setCredits(newCredits);
        setLastFetch(Date.now());
        return newCredits;
      } else {
        // Special handling for duplicate requests - don't treat as errors
        if (response.isDuplicate || response.statusCode === 429) {
          console.log('Duplicate credits request detected, using cached value');
          return credits;
        }
        
        throw new Error(response.message || 'Failed to fetch credits');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits';
      setError(errorMessage);
      // Track credits fetch errors
      UserJourneyLogger.logError(err as Error, {
        action: 'credits_fetch_failed',
        component: 'CreditsContext'
      });
      
      return credits;
    } finally {
      setLoading(false);
    }
  }, [credits]);

  // Force refresh - mainly for after operations that consume credits
  const refreshCredits = useCallback(async (force = true): Promise<number | null> => {
    if (!force && Date.now() - lastFetch < 5000) {
      return credits; // Use cached value if not forced and recent
    }
    return fetchCredits();
  }, [credits, fetchCredits, lastFetch]);

  // Load credits when the app starts
  useEffect(() => {
    fetchCredits();
  }, []);

  return (
    <CreditsContext.Provider value={{ 
      credits, 
      loading, 
      error, 
      fetchCredits, 
      refreshCredits 
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}