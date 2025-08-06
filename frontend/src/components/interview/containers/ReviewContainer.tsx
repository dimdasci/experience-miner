import { useNavigate } from 'react-router-dom';
import ReviewUI from '../views/ReviewUI';
import { useReviewInterview } from '../hooks/useReviewInterview';

interface ReviewContainerProps {
  interviewId?: string;
  onDraft: () => void;
}

const ReviewContainer = ({ interviewId, onDraft }: ReviewContainerProps) => {
  const navigate = useNavigate();
  const {
    interview,
    answers,
    loading,
    error,
    isExtracting,
    extractionError,
    loadInterview,
    extractInterview,
    clearExtractionError
  } = useReviewInterview(interviewId);

  const handleExtract = async () => {
    const success = await extractInterview();
    if (success) {
      navigate('/experience');
    }
  };

  const handleResume = () => {
    navigate(`/guide/interview/${interviewId}`);
  };

  const handleRetry = () => {
    loadInterview();
  };
  // Export interview and answers as markdown for download
  const handleExport = () => {
    if (!interview) return;
    let md = `# Interview: ${interview.title}\n\n`;
    answers.forEach(a => {
      md += `## Question ${a.question_number}: ${a.question}\n`;
      md += `${a.answer || ''}\n\n`;
      if (a.recording_duration_seconds) {
        md += `*Recording duration: ${a.recording_duration_seconds} seconds*\n\n`;
      }
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-${interview.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ReviewUI
      interview={interview ?? null}
      answers={answers}
      loading={loading}
      error={error}
      isExtracting={isExtracting}
      extractionError={extractionError}
      onRetry={handleRetry}
      onDraft={onDraft}
      onResume={handleResume}
      onExtract={handleExtract}
      onExport={handleExport}
      onClearError={clearExtractionError}
    />
  );
};

export default ReviewContainer;
