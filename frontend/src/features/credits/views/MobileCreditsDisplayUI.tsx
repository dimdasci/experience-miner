import { Coins } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface MobileCreditsDisplayUIProps {
  credits: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const MobileCreditsDisplayUI = ({ credits, loading, error, onRefresh }: MobileCreditsDisplayUIProps) => {
  if (error) {
    return (
      <div className="flex items-center space-x-1 text-accent">
        <Coins className="h-4 w-4" />
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-accent p-0 h-auto font-normal text-body-sm">
          Err
        </Button>
      </div>
    );
  }

  if (loading && credits === null) {
    return (
      <div className="flex items-center space-x-1 text-secondary">
        <Coins className="h-4 w-4 animate-spin" />
        <span className="text-body-sm">...</span>
      </div>
    );
  }

  const displayCredits = credits ?? 0;
  const isLow = displayCredits <= 10;
  const isEmpty = displayCredits <= 0;

  return (
    <button 
      className={`flex items-center space-x-1 focus-transitional-ring ${
        isEmpty ? 'text-accent' : 
        isLow ? 'text-yellow-600' : 
        'text-secondary'
      }`}
      onClick={onRefresh}
      title="Tap to refresh credits"
    >
      <Coins className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-body-sm font-medium">
        {displayCredits} {displayCredits === 1 ? 'credit' : 'credits'}
      </span>
    </button>
  );
};