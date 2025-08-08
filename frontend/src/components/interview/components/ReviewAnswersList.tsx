import { ReactNode } from 'react';

interface ReviewAnswersListProps {
  children: ReactNode;
}

const ReviewAnswersList = ({ children }: ReviewAnswersListProps) => {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
};

export default ReviewAnswersList;