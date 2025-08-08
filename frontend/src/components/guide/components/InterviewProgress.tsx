interface InterviewProgressProps {
  current: number;
  total: number;
  percentage: number;
  onNavigate?: (questionNumber: number) => void;
}

const InterviewProgress = ({ current, total, percentage }: InterviewProgressProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          Question {current} of {total}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default InterviewProgress;