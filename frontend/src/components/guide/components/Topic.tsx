import { Button } from '../../ui/button';
import { Topic as TopicType } from '../../../types/business';

interface TopicProps {
  topic: TopicType;
  isSelecting: boolean;
  onSelect: (topicId: string) => void;
}

const Topic = ({ topic, isSelecting, onSelect }: TopicProps) => {
  return (
    <div className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h3>
          <p className="text-gray-600 mb-2">{topic.motivational_quote}</p>
          <p className="text-sm text-gray-500">{topic.questions.length} questions</p>
        </div>
        <Button onClick={() => onSelect(topic.id)} disabled={isSelecting} className="ml-4">
          {isSelecting ? 'Starting...' : 'Start Interview'}
        </Button>
      </div>
    </div>
  );
};

export default Topic;