import { useParams, useNavigate } from 'react-router-dom';
import ChooseTopicContainer from '../guide/containers/ChooseTopicContainer';
import InterviewSessionContainer from '../guide/containers/InterviewSessionContainer';
import ReviewContainer from '../interview/containers/ReviewContainer';

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
        return <ChooseTopicContainer onTopicSelect={handleNavigateToStep} />;
      case 'interview':
        return <InterviewSessionContainer onComplete={(interviewId) => handleNavigateToStep('review', String(interviewId))} interviewId={id} />;
      case 'review':
        return (
          <ReviewContainer
            onDraft={() => navigate('/interviews')}
            interviewId={id}
          />
        );
      default:
        return <ChooseTopicContainer onTopicSelect={handleNavigateToStep} />;
    }
  };

  return (
    <div className="p-6">
      {renderStep()}
    </div>
  );
};

export default GuidePage;