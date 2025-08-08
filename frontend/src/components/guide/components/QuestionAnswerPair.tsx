import { ReactNode } from 'react';

interface QuestionAnswerPairProps {
  children: ReactNode;
}

const QuestionAnswerPair = ({ children }: QuestionAnswerPairProps) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      {children}
    </div>
  );
};

export default QuestionAnswerPair;