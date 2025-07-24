import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import Recorder from '../interview/Recorder';
import { useInterviewSession } from '../../hooks/useInterviewSession';

interface InterviewSessionViewProps {
  onComplete: () => void;
}

const InterviewSessionView = ({ onComplete }: InterviewSessionViewProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { sessionData, addResponse, persistSession } = useInterviewSession();

  // Sample questions for each topic
  const topicQuestions: Record<string, string[]> = {
    'career-overview': [
      'Can you begin by describing your first job or the initial steps you took in your career? What drew you to this role or field?',
      'How has your career evolved since those early days? What key transitions or pivotal moments shaped your professional journey?',
      'What industries or sectors have you worked in, and how did you navigate any changes between them?',
      'Looking back, what patterns or themes do you notice in your career choices and progressions?',
      'How would you describe your overall career trajectory to someone who doesn\'t know your background?'
    ],
    'key-achievements': [
      'What would you consider your most significant professional achievement to date? Can you walk me through what made it special?',
      'Tell me about a time when you exceeded expectations or delivered exceptional results. What was the impact?',
      'Have you received any notable recognition, awards, or acknowledgments in your career? What led to those?',
      'What project or initiative are you most proud of? What role did you play in its success?',
      'Can you describe a challenge you overcame that resulted in a major win for you or your organization?'
    ],
    'career-goals': [
      'What are your primary short-term career goals for the next 1-2 years?',
      'How do your short-term goals connect to your longer-term career aspirations?',
      'What specific steps are you taking or planning to take to achieve these goals?',
      'Are there particular skills, experiences, or qualifications you\'re working to develop?',
      'How does your ideal career path look 5-10 years from now?'
    ]
  };

  useEffect(() => {
    const topic = localStorage.getItem('selectedTopic') || 'career-overview';
    setSelectedTopic(topic);
  }, []);

  const getTopicTitle = (topicId: string) => {
    const titles: Record<string, string> = {
      'career-overview': 'Career Overview',
      'key-achievements': 'Key Achievements',
      'career-goals': 'Career Goals and Aspirations'
    };
    return titles[topicId] || topicId;
  };

  const questions = topicQuestions[selectedTopic] || topicQuestions['career-overview'];
  const isLastQuestion = currentQuestion >= questions.length - 1;

  const handleDataUpdate = (data: any) => {
    const questionData = {
      ...data,
      question: questions[currentQuestion],
      questionIndex: currentQuestion
    };
    addResponse(questionData);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      persistSession();
      onComplete();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSessionComplete = () => {
    persistSession();
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {getTopicTitle(selectedTopic)}
          </h1>
          <div className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Q{currentQuestion + 1}/{questions.length}: {questions[currentQuestion]}
          </h2>
          <p className="text-sm text-gray-600">
            Some hints how to answer
          </p>
        </div>

        <div className="space-y-6">
          <Recorder 
            onDataUpdate={handleDataUpdate}
            onSessionComplete={handleSessionComplete}
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
              {isLastQuestion ? 'Complete Interview' : 'Next Question'}
            </Button>
          </div>
        </div>
      </div>

      {sessionData.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Session Progress</h3>
          <div className="text-sm text-gray-600">
            Completed {sessionData.length} of {questions.length} questions
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSessionView;