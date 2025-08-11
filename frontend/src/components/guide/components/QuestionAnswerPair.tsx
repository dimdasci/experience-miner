import { ReactNode } from 'react';

interface QuestionAnswerPairProps {
  children: ReactNode;
}

const QuestionAnswerPair = ({ children }: QuestionAnswerPairProps) => {
  return (
    <div className="space-y-10 flex flex-col flex-grow min-h-0 pb-10">
      {children}
    </div>
  );
};

export default QuestionAnswerPair;