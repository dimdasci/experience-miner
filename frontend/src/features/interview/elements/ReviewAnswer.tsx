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
      <div className="flex items-baseline space-x-6">
        <div className="flex-shrink-0 w-7 flex justify-center text-body-lg text-secondary tabular-nums">{questionNumber}</div>
        <div className="flex-grow">
          <h2 className="text-body-lg font-medium text-primary leading-snug">
            {question}
          </h2>
        </div>
      </div>
      
      {/* Answer Section - aligned with question text */}
      <div className="mt-10 ml-14">
        <div className="text-body text-primary whitespace-pre-wrap leading-relaxed">
          {answer || 'No response given'}
        </div>
      </div>
    </>
  );
};

export default ReviewAnswer;