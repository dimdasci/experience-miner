import { Topic } from '@shared/types/business';
import SectionHeader from '@shared/components/ui/section-header';
import TopicComponent from '../elements/Topic';
import ErrorMessage from '@shared/components/ui/error-message';

interface TopicsListProps {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  selecting: string | null;
  onReload: () => void;
  onSelect: (topicId: string) => void;
}

const TopicsList = ({ topics, loading, error, selecting, onReload, onSelect }: TopicsListProps) => {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-secondary">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <SectionHeader 
          title="Interview Topics"
          subtitle="Pick a starting point. We'll suggest new topics as we learn more about your story."
        />
        {error && (
          <div className="mt-12">
            <ErrorMessage 
              message={error}
              onRetry={onReload}
              className="mx-6 mb-8"
            />
          </div>
        )}
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="space-y-10">
            {topics.map(topic => (
              <TopicComponent 
                key={topic.id} 
                topic={topic}
                isSelecting={selecting === topic.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
    </div>
  );
};

export default TopicsList;
