import { useParams, useNavigate } from 'react-router-dom';
import ChooseTopicView from '../guide/ChooseTopicView';
import InterviewSessionView from '../guide/InterviewSessionView';
import ReviewView from '../interview/ReviewView';

const GuidePage = () => {
  const { step, id } = useParams();
  const navigate = useNavigate();

  const handleNavigateToStep = (newStep: string, interviewId?: string) => {
    if (interviewId) {
      navigate(`/guide/${newStep}/${interviewId}`);
    } else {
      navigate(`/guide/${newStep}`);
    }
  };


  // Default to topic selection if no step specified
  const currentStep = step || 'topics';

  const renderStep = () => {
    switch (currentStep) {
      case 'topics':
        return <ChooseTopicView onTopicSelect={handleNavigateToStep} />;
      case 'interview':
        return <InterviewSessionView onComplete={(interviewId) => handleNavigateToStep('review', String(interviewId))} interviewId={id} />;
      case 'review':
        return (
          <ReviewView 
            onExtract={() => {}} // No longer needed - extraction handled internally
            onDraft={() => navigate('/interviews')}
            interviewId={id}
          />
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