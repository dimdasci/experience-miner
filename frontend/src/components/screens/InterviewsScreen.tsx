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
        <div className="p-4 lg:p-6">
          <ReviewContainer interviewId={id} onDraft={handleDraft} />
        </div>
      </div>
    );
  }

  // Delegate interview list management to proper container
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 lg:p-6">
        <InterviewListContainer />
      </div>
    </div>
  );

};

export default InterviewsScreen;