import { CheckCircle, ClockFading } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Interview } from '@shared/types/business';

interface InterviewItemProps {
  interview: Interview;
  onSelect: (interview: Interview) => void;
}

const InterviewItem = ({ interview, onSelect }: InterviewItemProps) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCompleted = interview.status === 'completed';
  const StatusIcon = isCompleted ? CheckCircle : ClockFading;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(interview);
  };

  return (
    <div className="py-2 group flex gap-4 md:gap-6">
      {/* Status icon - vertically centered */}
      <div className="flex-shrink-0 flex justify-center items-center h-5 md:h-7">
        <StatusIcon className={`w-5 h-5 md:w-7 mt-2.5 md:mt-1 transition-colors ${
          isCompleted 
            ? 'text-primary group-hover:text-accent' 
            : 'text-secondary group-hover:text-accent'
        }`} />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-mobile-headline md:text-headline font-medium mb-2 leading-8 -ml-1 -mt-1">
          <Link
            to="#"
            className="block focus-transitional-invert cursor-pointer transition-colors text-primary hover:text-accent"
            onClick={handleClick}
          >
            {interview.title}
          </Link>
        </h3>
        <p className="text-body text-secondary mb-2">{interview.overview}</p>
        <span className="text-body-sm text-secondary tabular-nums">{formatDateTime(interview.updated_at)}</span>
      </div>
    </div>
  );
};

export default InterviewItem;