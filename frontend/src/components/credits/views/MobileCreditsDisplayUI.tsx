import { Coins } from 'lucide-react';

interface MobileCreditsDisplayUIProps {
  credits: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const MobileCreditsDisplayUI = ({ credits, loading, error, onRefresh }: MobileCreditsDisplayUIProps) => {
  if (error) {
    return (
      <div className="flex items-center space-x-1 text-destructive">
        <Coins className="h-3 w-3" />
        <span className="text-xs cursor-pointer" onClick={onRefresh}>Err</span>
      </div>
    );
  }

  if (loading && credits === null) {
    return (
      <div className="flex items-center space-x-1 text-muted-foreground">
        <Coins className="h-3 w-3 animate-spin" />
        <span className="text-xs">...</span>
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
      onClick={onRefresh}
      title="Tap to refresh credits"
      style={{ cursor: 'pointer' }}
    >
      <Coins className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      <span className="text-xs font-medium">
        {displayCredits} {displayCredits === 1 ? 'credit' : 'credits'}
      </span>
    </div>
  );
};