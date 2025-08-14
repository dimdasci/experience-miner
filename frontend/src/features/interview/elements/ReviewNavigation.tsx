import { Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface ReviewNavigationProps {
  onDraft: () => void;
  onResume: () => void;
  onExport: () => void;
  onExtract: () => void;
  answeredCount: number;
  totalCount: number;
  isExtracting: boolean;
}

const ReviewNavigation = ({ 
  onDraft, 
  onResume, 
  onExport, 
  onExtract, 
  answeredCount, 
  totalCount, 
  isExtracting 
}: ReviewNavigationProps) => {
  return (
    <div className="mt-8 flex justify-between items-center bg-gray-50 rounded-lg p-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Ready to process your responses?</h3>
        <p className="text-gray-600 text-sm">
          Extract structured insights from your interview or save as draft ({answeredCount} of {totalCount} questions answered)
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onDraft}>Save as Draft</Button>
        <Button variant="outline" onClick={onResume}>Resume Interview</Button>
        <Button variant="outline" onClick={onExport}>Export</Button>
        <Button onClick={onExtract} className="bg-green-600 hover:bg-green-700" disabled={answeredCount === 0 || isExtracting}>
          {isExtracting ? (<><Loader2 className="w-4 h-4 animate-spin mr-2"/>Processing...</>) : 'Complete & Analyze'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewNavigation;