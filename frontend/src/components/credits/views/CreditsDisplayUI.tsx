import { Coins } from 'lucide-react';
import { Button } from '../../ui/button';

interface CreditsDisplayUIProps {
  credits: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const CreditsDisplayUI = ({ credits, loading, error, onRefresh }: CreditsDisplayUIProps) => {
  if (error) {
    return (
      <div className="flex items-center space-x-1 text-accent">
        <Coins className="h-4 w-4" />
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-accent p-0 h-auto font-normal">
          Error
        </Button>
      </div>
    );
  }

  if (loading && credits === null) {
    return (
      <div className="flex items-center space-x-1 text-secondary">
        <Coins className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const displayCredits = credits ?? 0;
  const isLow = displayCredits <= 10;
  const isEmpty = displayCredits <= 0;

  return (
    <button
      className={`flex items-center space-x-1 focus-ring ${
        isEmpty ? 'text-accent' : 
        isLow ? 'text-yellow-600' : 
        'text-secondary'
      }`}
      onClick={onRefresh}
      title="Click to refresh credits"
    >
      <Coins className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">
        {displayCredits} {displayCredits === 1 ? 'credit' : 'credits'}
      </span>
    </button>
  );
};
