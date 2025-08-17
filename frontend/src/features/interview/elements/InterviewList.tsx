import { Button } from '@shared/components/ui/button';
import SectionHeader from '@shared/components/ui/section-header';
import InterviewItem from './InterviewItem';
import { Interview } from '@shared/types/business';
import ErrorMessage from '@shared/components/ui/error-message';
import { MicOff } from 'lucide-react';

interface InterviewListProps {
  interviews: Interview[];
  loading: boolean;
  error: string | null;
  onSelectInterview: (interview: Interview) => void;
  onRetry: () => void;
  onStartInterview: () => void;
}

const InterviewList = ({ 
  interviews, 
  loading, 
  error, 
  onSelectInterview, 
  onRetry,
  onStartInterview 
}: InterviewListProps) => {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-secondary">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <SectionHeader 
          title="All Your Stories" 
          subtitle=""
        />
        {error && (
          <div className="mt-12">
            <ErrorMessage 
              message={error}
              onRetry={onRetry}
              className="mx-6 mb-8"
            />
          </div>
        )}
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
        <div>
          {interviews.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="text-secondary mb-4">
                <MicOff className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">No interviews yet</h3>
              <p className="text-secondary mb-4">Start your first interview in the Guide section</p>
              <Button onClick={onStartInterview}>
                Go to Guide
              </Button>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-10">
              {interviews.map((interview) => (
                <InterviewItem 
                  key={interview.id} 
                  interview={interview}
                  onSelect={onSelectInterview}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
    </div>
  );
};

export default InterviewList;