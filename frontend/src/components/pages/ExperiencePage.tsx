import { useNavigate } from 'react-router-dom';
import ExperienceView from './ExperienceView';

const ExperiencePage = () => {
  const navigate = useNavigate();

  const handleStartNewInterview = () => {
    navigate('/guide');
  };

  return (
    <div className="p-6">
      <ExperienceView 
        onRestart={handleStartNewInterview}
      />
    </div>
  );
};

export default ExperiencePage;