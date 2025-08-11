interface FocusedQuestionProps {
  question: string;
  number: number;
  total: number;
}

const FocusedQuestion = ({ question, number, total }: FocusedQuestionProps) => {
  return (
    <div className="mt-16 flex items-baseline space-x-6">
      <div className="flex-shrink-0 w-8 flex justify-center text-headline font-serif font-medium text-secondary">Q</div>
      <div className="flex-grow">
        <h2 className="text-headline font-medium text-primary leading-snug">
          {question}
        </h2>
      </div>
    </div>
  );
};

export default FocusedQuestion;