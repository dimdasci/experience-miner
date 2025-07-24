import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import { QuestionService } from '../../services/questionService';

interface ReviewViewProps {
  onExtract: () => void;
  onDraft: () => void;
}

const ReviewView = ({ onExtract, onDraft }: ReviewViewProps) => {
  const { sessionData, loadSession } = useInterviewSession();
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  useEffect(() => {
    loadSession();
    const topic = localStorage.getItem('selectedTopic');
    if (topic) {
      setSelectedTopic(topic);
    }
  }, [loadSession]);

  const handleExtract = () => {
    // Mark interview as ready for extraction
    localStorage.setItem('readyForExtraction', 'true');
    onExtract();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Your Responses
        </h1>
        <p className="text-gray-600">
          Review your answers for {QuestionService.getTopicTitle(selectedTopic)} before processing
        </p>
      </div>

      <div className="space-y-6">
        {sessionData.map((item, index) => (
          <div key={index} className="bg-white border rounded-lg p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Question {index + 1}
              </h3>
              <p className="text-gray-700 mb-4">
                {item.question}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {item.response || 'No response recorded'}
              </p>
              {item.audioUrl && (
                <div className="mt-3">
                  <audio controls className="w-full">
                    <source src={item.audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessionData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500">No interview responses found</p>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center bg-gray-50 rounded-lg p-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            Ready to process your responses?
          </h3>
          <p className="text-gray-600 text-sm">
            Extract structured insights from your interview or save as draft
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={onDraft}
          >
            Save as Draft
          </Button>
          <Button 
            onClick={handleExtract}
            className="bg-green-600 hover:bg-green-700"
            disabled={sessionData.length === 0}
          >
            Complete & Analyze
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewView;