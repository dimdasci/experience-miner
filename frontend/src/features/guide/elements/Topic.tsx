import { Topic as TopicType } from '@shared/types/business';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopicProps {
  topic: TopicType;
  isSelecting: boolean;
  onSelect: (topicId: string) => void;
}

const Topic = ({ topic, isSelecting, onSelect }: TopicProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isSelecting) {
      e.preventDefault(); // Prevent navigation if already selecting
      return;
    }
    // API call will happen on click, navigation handled by Link
    onSelect(topic.id);
  };

  return (
    <div className={`py-2 group flex gap-6 ${
      isSelecting ? 'opacity-50' : ''
    }`}>
      {/* Decorative chevron - vertically centered in title's 28px height */}
      <div className="flex-shrink-0 w-12 flex justify-center items-center h-7">
        <ChevronRight className={`w-7 h-7 pt-1 transition-colors ${
          isSelecting 
            ? 'text-secondary' 
            : 'text-secondary group-hover:text-accent'
        }`} />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-headline font-medium mb-2 leading-8 -ml-1 -mt-1">
          <Link
            to="#"
            className={`block focus-transitional-invert cursor-pointer transition-colors ${
              isSelecting 
                ? 'text-secondary cursor-wait pointer-events-none' 
                : 'text-primary hover:text-accent'
            }`}
            onClick={handleClick}
          >
            {isSelecting ? `${topic.title} - Starting...` : topic.title}
          </Link>
        </h3>
        <p className="text-body text-secondary">{topic.motivational_quote}</p>
      </div>
    </div>
  );
};

export default Topic;