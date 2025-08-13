import { Topic as TopicType } from '../../../types/business';
import { ChevronRight } from 'lucide-react';

interface TopicProps {
  topic: TopicType;
  isSelecting: boolean;
  onSelect: (topicId: string) => void;
}

const Topic = ({ topic, isSelecting, onSelect }: TopicProps) => {
  const handleClick = () => {
    if (!isSelecting) {
      onSelect(topic.id);
    }
  };

  return (
    <button 
      className={`cursor-pointer transition-colors py-2 group flex gap-6 focus-ring text-left ${
        isSelecting ? 'opacity-50 cursor-wait' : ''
      }`}
      onClick={handleClick}
      disabled={isSelecting}
    >
      {/* Decorative chevron - vertically centered in title's 28px height */}
      <div className="flex-shrink-0 w-12 flex justify-center items-center h-7">
        <ChevronRight className={`w-5 h-5 pt-1 transition-colors ${
          isSelecting 
            ? 'text-secondary' 
            : 'text-secondary group-hover:text-accent'
        }`} />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className={`text-headline font-medium mb-2 leading-8 transition-colors ${
          isSelecting 
            ? 'text-secondary' 
            : 'text-primary group-hover:text-accent'
        }`}>
          {isSelecting ? `${topic.title} - Starting...` : topic.title}
        </h3>
        <p className="text-body text-secondary">{topic.motivational_quote}</p>
      </div>
    </button>
  );
};

export default Topic;