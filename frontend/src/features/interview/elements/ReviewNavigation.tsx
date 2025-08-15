import { Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface ReviewNavigationProps {
  onDraft: () => void;
  onResume: () => void;
  onExport: () => void;
  onExtract: () => void;
  answeredCount: number;
  totalCount: number;
  isExtracting: boolean;
  hasMinimumContent: boolean;
}

const ReviewNavigation = ({ 
  onDraft, 
  onResume, 
  onExport, 
  onExtract, 
  answeredCount, 
  totalCount, 
  isExtracting,
  hasMinimumContent
}: ReviewNavigationProps) => {
  return (
    <div className="flex-shrink-0 py-6 flex justify-center items-center">
      <div className="flex gap-3">
        <Button variant="outline" onClick={onDraft}>Finish Later</Button>
        <Button variant="outline" onClick={onResume}>Resume</Button>
        <Button variant="outline" onClick={onExport}>Export</Button>
        <Button 
          onClick={onExtract} 
          variant={hasMinimumContent ? "accent" : "outline"}
          disabled={!hasMinimumContent || isExtracting}
        >
          {isExtracting ? (<><Loader2 className="w-4 h-4 animate-spin mr-2"/>Processing...</>) : 'Analyze'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewNavigation;