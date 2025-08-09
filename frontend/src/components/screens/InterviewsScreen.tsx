import { useNavigate, useParams } from 'react-router-dom';
import ReviewContainer from '../interview/containers/ReviewContainer';
import InterviewListContainer from '../interview/containers/InterviewListContainer';

const InterviewsScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isReviewMode = !!id;

  if (isReviewMode) {
    const handleDraft = () => navigate('/interviews');
    return (
      <div className="h-full overflow-y-auto">
        <ReviewContainer interviewId={id} onDraft={handleDraft} />
      </div>
    );
  }

  // Delegate interview list management to proper container
  return (
    <div className="h-full overflow-y-auto">
      <InterviewListContainer />
    </div>
  );

};

export default InterviewsScreen;