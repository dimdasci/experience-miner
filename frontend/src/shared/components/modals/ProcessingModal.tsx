import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

interface ProcessingModalProps {
  isProcessing: boolean;
  error?: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

const ProcessingModal = ({ isProcessing, error, onRetry, onCancel }: ProcessingModalProps) => {
  if (!isProcessing && !error) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        {isProcessing && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let me organise your story</h3>
            <p className="text-gray-600 mb-4">
              I'm going through your story to pull out the important details about your career - where you've worked, 
              what you've accomplished, and what makes you proud. Then I'll suggest what we should talk about next. 
            </p>
            <p className="text-gray-600 mb-4">
              Give me 2-3 minutes to work through this. Please do not close the window
            </p>
            <div className="text-sm text-gray-500">Please don't close this window while we work</div>
          </div>
        )}
        
        {error && (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let me organise your story</h3>
            <p className="text-gray-600 mb-6">
              Oops! I had trouble processing your story right now. Your answers are safe though - you can try the analysis again anytime.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onCancel}>Finish later</Button>
              <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">Try again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingModal;