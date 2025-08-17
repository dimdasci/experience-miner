interface ReviewAnswerProps {
  questionNumber: number;
  question: string;
  answer: string | null;
  recordingDuration?: number | null;
}

const ReviewAnswer = ({ questionNumber, question, answer }: ReviewAnswerProps) => {
  return (
    <>
      {/* Question Section - matching FocusedQuestion pattern */}
      <div className="flex items-baseline md:space-x-6">
        <div className="hidden md:flex flex-shrink-0 w-7 justify-center text-mobile-body-lg-lh md:text-body-lg text-secondary tabular-nums">{questionNumber}</div>
        <div className="flex-grow">
          <h2 className="text-mobile-body-lg-lh md:text-body-lg font-medium text-primary leading-snug">
            {question}
          </h2>
        </div>
      </div>
      
      {/* Answer Section - aligned with question text */}
      <div className="mt-6 md:mt-10 md:ml-13">
        <div className="text-body-lg text-secondary whitespace-pre-wrap leading-relaxed">
          {answer || 'No response given'}
        </div>
      </div>
    </>
  );
};

export default ReviewAnswer;