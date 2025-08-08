import { Topic } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import TopicComponent from '../components/Topic';

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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading topics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader 
        title="Interview Topics"
        subtitle="Pick a starting point. We'll suggest new topics as we learn more about your story."
      />
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
          <button onClick={onReload} className="mt-2 text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      )}

      <div className="space-y-6">
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
