import { useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';
import { useCredits } from '../../contexts/CreditsContext';

export const CreditsDisplay = () => {
  const { credits, loading, error, refreshCredits } = useCredits();
  // Create a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (isMounted.current) {
      await refreshCredits(true);
    }
  };

  if (error) {
    return (
      <div className="flex items-center space-x-1 text-destructive">
        <Coins className="h-4 w-4" />
        <span className="text-sm cursor-pointer" onClick={handleRefresh}>Error</span>
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
    <div 
      className={`flex items-center space-x-1 ${
        isEmpty ? 'text-destructive' : 
        isLow ? 'text-yellow-600' : 
        'text-muted-foreground'
      }`}
      onClick={handleRefresh}
      title="Click to refresh credits"
      style={{ cursor: 'pointer' }}
    >
      <Coins className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">
        {displayCredits} {displayCredits === 1 ? 'credit' : 'credits'}
      </span>
    </div>
  );
};