interface ReviewAnswerProps {
  questionNumber: number;
  question: string;
  answer: string | null;
  recordingDuration?: number | null;
}

const ReviewAnswer = ({ questionNumber, question, answer, recordingDuration }: ReviewAnswerProps) => {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Question {questionNumber}</h3>
        <p className="text-gray-700 mb-4">{question}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{answer || 'No response recorded'}</p>
        {recordingDuration && (
          <div className="mt-3 text-sm text-gray-500">
            Recording duration: {recordingDuration} seconds
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewAnswer;