import { Topic } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import TopicComponent from '../components/Topic';
import ErrorMessage from '../../ui/error-message';

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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary">Loading topics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader 
        title="Interview Topics"
        subtitle="Pick a starting point. We'll suggest new topics as we learn more about your story."
      />
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={onReload}
          className="mb-8"
        />
      )}

      <div className="space-y-8">
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
  );
};

export default TopicsList;
