import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Coins } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useCredits } from '../../contexts/CreditsContext';
import { UserJourneyLogger } from '../../utils/logger';

interface CreditsDisplayProps {
  onCreditsUpdate?: (credits: number) => void;
}

export interface CreditsDisplayHandle {
  updateCredits: (credits: number) => void;
  fetchCredits: () => Promise<number | null>;
}

export const CreditsDisplay = forwardRef<CreditsDisplayHandle, CreditsDisplayProps>(({ onCreditsUpdate }, ref) => {
  const { credits: contextCredits, updateCredits: updateContextCredits } = useCredits();
  const [credits, setCredits] = useState<number | null>(contextCredits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Sync with context
  useEffect(() => {
    if (contextCredits !== null) {
      setCredits(contextCredits);
    }
  }, [contextCredits]);

  const fetchCredits = useCallback(async (force = false) => {
    const now = Date.now();
    // Cache for 5 seconds unless forced
    if (!force && now - lastFetch < 5000) {
      return credits;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getCredits();
      
      if (response.success) {
        const newCredits = response.responseObject.credits;
        setCredits(newCredits);
        updateContextCredits(newCredits);
        setLastFetch(now);
        onCreditsUpdate?.(newCredits);
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
        component: 'CreditsDisplay'
      })
      
      return credits;
    } finally {
      setLoading(false);
    }
  }, [credits, lastFetch, onCreditsUpdate, updateContextCredits]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, []);

  const updateCreditsFromResponse = useCallback((newCredits: number) => {
    setCredits(newCredits);
    updateContextCredits(newCredits);
    setLastFetch(Date.now());
    onCreditsUpdate?.(newCredits);
  }, [onCreditsUpdate, updateContextCredits]);

  // Expose methods for external components to use
  useImperativeHandle(ref, () => ({
    fetchCredits: () => fetchCredits(true),
    updateCredits: updateCreditsFromResponse,
  }));

  if (error) {
    return (
      <div className="flex items-center space-x-1 text-destructive">
        <Coins className="h-4 w-4" />
        <span className="text-sm">Error</span>
      </div>
    );
  }

  if (loading && credits === null) {
    return (
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Coins className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const displayCredits = credits ?? 0;
  const isLow = displayCredits <= 10;
  const isEmpty = displayCredits <= 0;

  return (
    <div className={`flex items-center space-x-1 ${
      isEmpty ? 'text-destructive' : 
      isLow ? 'text-yellow-600' : 
      'text-muted-foreground'
    }`}>
      <Coins className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">
        {displayCredits} {displayCredits === 1 ? 'credit' : 'credits'}
      </span>
    </div>
  );
});