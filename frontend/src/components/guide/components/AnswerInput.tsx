import { ReactNode } from 'react';

interface AnswerInputProps {
  children: ReactNode;
}

const AnswerInput = ({ children }: AnswerInputProps) => {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};

export default AnswerInput;