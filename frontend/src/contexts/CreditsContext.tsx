import React, { createContext, useContext, useState, useCallback } from 'react';

interface CreditsContextType {
  credits: number | null;
  updateCredits: (credits: number) => void;
  resetCreditsCache: () => void;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);

  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits);
  }, []);

  const resetCreditsCache = useCallback(() => {
    setCredits(null);
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, updateCredits, resetCreditsCache }}>
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