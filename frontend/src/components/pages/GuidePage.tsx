import { useParams, useNavigate } from 'react-router-dom';
import ChooseTopicView from '../guide/ChooseTopicView';
import InterviewSessionView from '../guide/InterviewSessionView';
import ReviewView from '../guide/ReviewView';
import FactsView from '../interview/FactsView';

const GuidePage = () => {
  const { step } = useParams();
  const navigate = useNavigate();

  const handleNavigateToStep = (newStep: string) => {
    navigate(`/guide/${newStep}`);
  };

  const handleComplete = () => {
    navigate('/guide');
  };

  // Default to topic selection if no step specified
  const currentStep = step || 'topics';

  const renderStep = () => {
    switch (currentStep) {
      case 'topics':
        return <ChooseTopicView onTopicSelect={handleNavigateToStep} />;
      case 'interview':
        return <InterviewSessionView onComplete={() => handleNavigateToStep('review')} />;
      case 'review':
        return (
          <ReviewView 
            onExtract={() => handleNavigateToStep('extract')} 
            onDraft={handleComplete}
          />
        );
      case 'extract':
        return (
          <div className="max-w-6xl mx-auto">
            <FactsView 
              sessionData={JSON.parse(localStorage.getItem('interviewSession') || '[]')} 
              onRestart={() => {
                localStorage.removeItem('interviewSession');
                localStorage.removeItem('selectedTopic');
                localStorage.removeItem('readyForExtraction');
                handleComplete();
              }}
            />
          </div>
        );
      default:
        return <ChooseTopicView onTopicSelect={handleNavigateToStep} />;
    }
  };

  return (
    <div className="p-6">
      {renderStep()}
    </div>
  );
};

export default GuidePage;