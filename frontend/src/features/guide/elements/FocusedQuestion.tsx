interface FocusedQuestionProps {
  question: string;
  number?: number;
  total?: number;
}

const FocusedQuestion = ({ question, number: _number, total: _total }: FocusedQuestionProps) => {
  return (
    <div className="mt-10 md:mt-16 flex items-baseline md:space-x-6">
      <div className="hidden md:flex flex-shrink-0 w-7 justify-center text-mobile-headline md:text-headline font-serif font-medium text-secondary">Q</div>
      <div className="flex-grow">
        <h2 className="text-mobile-headline md:text-headline font-medium text-primary leading-snug">
          {question}
        </h2>
      </div>
    </div>
  );
};

export default FocusedQuestion;