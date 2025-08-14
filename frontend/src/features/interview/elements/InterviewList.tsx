import { Button } from '../../ui/button';
import SectionHeader from '../../ui/section-header';
import InterviewItem from './InterviewItem';
import { Interview } from '../../../types/business';

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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading interviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader 
        title="All Your Stories" 
        subtitle="All your interview sessions in one place - both finished and in progress. You can review what you shared and update your career profile anytime."
      />

      {error && (
        <div className="mb-6 p-4 bg-accent border border-accent rounded-lg">
          <div className="text-surface">{error}</div>
          <button 
            onClick={onRetry}
            className="mt-2 text-surface hover:text-surface/80 underline focus-ring"
          >
            Try again
          </button>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
          <p className="text-gray-500 mb-4">Start your first interview in the Guide section</p>
          <Button onClick={onStartInterview}>
            Start Interview
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map(interview => (
            <InterviewItem 
              key={interview.id} 
              interview={interview}
              onSelect={onSelectInterview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewList;