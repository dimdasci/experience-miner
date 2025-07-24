import { Button } from '../ui/button';
import { QuestionService } from '../../services/questionService';

interface ChooseTopicViewProps {
  onTopicSelect: (step: string) => void;
}

const ChooseTopicView = ({ onTopicSelect }: ChooseTopicViewProps) => {
  const topics = QuestionService.getAvailableTopics();

  const handleTopicSelect = (topicId: string) => {
    // Store selected topic for the interview session
    localStorage.setItem('selectedTopic', topicId);
    onTopicSelect('interview');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Guide Screen: Starting Point
        </h1>
        <p className="text-gray-600 text-lg">
          Choose a topic of next talk
        </p>
      </div>

      <div className="space-y-6">
        {topics.map((topic) => (
          <div key={topic.id} className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {topic.title}
                </h3>
                <p className="text-gray-600 mb-2">
                  {topic.description}
                </p>
                <p className="text-sm text-gray-500">
                  {topic.questionCount} questions
                </p>
              </div>
              <Button 
                onClick={() => handleTopicSelect(topic.id)}
                className="ml-4"
              >
                Start Interview
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Professional Summary</h4>
            <p className="text-blue-700 text-sm">
              When we learn a user, or intro when we just start
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseTopicView;