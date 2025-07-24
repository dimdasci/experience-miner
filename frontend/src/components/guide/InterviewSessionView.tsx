import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import GuideRecorder from './GuideRecorder';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import { QuestionService } from '../../services/questionService';

interface InterviewSessionViewProps {
  onComplete: () => void;
}

const InterviewSessionView = ({ onComplete }: InterviewSessionViewProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { sessionData, addResponse, persistSession } = useInterviewSession();

  useEffect(() => {
    const topic = localStorage.getItem('selectedTopic') || 'career_overview';
    setSelectedTopic(topic);
  }, []);

  // const questions = QuestionService.getQuestionsByTopic(selectedTopic);
  const currentQuestionObj = QuestionService.getQuestionByIndex(selectedTopic, currentQuestion);
  const progress = QuestionService.getTopicProgress(selectedTopic, currentQuestion);
  const topicTitle = QuestionService.getTopicTitle(selectedTopic);

  const handleDataUpdate = (data: any) => {
    if (!currentQuestionObj) return;
    
    const questionData = {
      ...data,
      question: currentQuestionObj.text,
      questionId: currentQuestionObj.id,
      questionIndex: currentQuestion
    };
    addResponse(questionData);
  };

  // Get existing response for current question
  const getCurrentQuestionResponse = () => {
    return sessionData.find(item => 
      item.questionId === currentQuestionObj?.id || 
      item.questionIndex === currentQuestion
    )?.response || '';
  };

  const handleNextQuestion = () => {
    if (progress.isComplete) {
      persistSession();
      onComplete();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {topicTitle}
          </h1>
          <div className="text-sm text-gray-500">
            Question {progress.current} of {progress.total}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {currentQuestionObj && (
        <div className="bg-white border rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Q{progress.current}/{progress.total}: {currentQuestionObj.text}
            </h2>
            <p className="text-sm text-gray-600">
              Some hints how to answer
            </p>
          </div>

          <div className="space-y-6">
            <GuideRecorder 
              onDataUpdate={handleDataUpdate}
              questionId={currentQuestionObj.id}
              questionText={currentQuestionObj.text}
              existingResponse={getCurrentQuestionResponse()}
            />

            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous Question
              </Button>
              
              <Button 
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {progress.isComplete ? 'Complete Interview' : 'Next Question'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {sessionData.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Session Progress</h3>
          <div className="text-sm text-gray-600">
            Completed {sessionData.length} of {progress.total} questions
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSessionView;