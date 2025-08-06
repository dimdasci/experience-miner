import { Coins } from 'lucide-react';
// UI component for CreditsDisplay, no extra Button import needed

interface CreditsDisplayUIProps {
  credits: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const CreditsDisplayUI = ({ credits, loading, error, onRefresh }: CreditsDisplayUIProps) => {
  if (error) {
    return (
      <div className="flex items-center space-x-1 text-destructive">
        <Coins className="h-4 w-4" />
        <span className="text-sm cursor-pointer" onClick={onRefresh}>Error</span>
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
      onClick={onRefresh}
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
