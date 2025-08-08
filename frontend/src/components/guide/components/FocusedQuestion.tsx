interface FocusedQuestionProps {
  question: string;
  number: number;
  total: number;
}

const FocusedQuestion = ({ question, number, total }: FocusedQuestionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-3">
        Q{number}/{total}: {question}
      </h2>
    </div>
  );
};

export default FocusedQuestion;