import { useEffect, useRef, useCallback } from 'react';
import { useCredits } from '../../../contexts/CreditsContext';

export const useCreditsDisplay = () => {
  const { credits, loading, error, refreshCredits } = useCredits();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    if (isMounted.current) {
      await refreshCredits(true);
    }
  }, [refreshCredits]);

  return { credits, loading, error, onRefresh };
};
