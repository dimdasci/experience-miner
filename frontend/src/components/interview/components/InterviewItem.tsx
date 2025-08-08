import { Button } from '../../ui/button';
import { Interview } from '../../../types/business';

interface InterviewItemProps {
  interview: Interview;
  onSelect: (interview: Interview) => void;
}

const InterviewItem = ({ interview, onSelect }: InterviewItemProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">{formatDate(interview.updated_at)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              interview.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {interview.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {interview.title}
          </h3>
        </div>
        
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(interview)}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewItem;