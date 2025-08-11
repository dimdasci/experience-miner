interface InterviewProgressProps {
  current: number;
  total: number;
  percentage: number;
  onNavigate?: (questionNumber: number) => void;
}

const InterviewProgress = ({ current, total, percentage }: InterviewProgressProps) => {
  return (
    <div className="mt-12 flex justify-center items-center space-x-2 sm:space-x-4">
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const isCurrent = step === current;
        const isCompleted = step < current;
        
        return (
          <div 
            key={step} 
            className={`w-9 h-9 rounded-full flex items-center justify-center font-medium transition-all ${
              isCurrent 
                ? 'bg-primary text-surface' 
                : isCompleted 
                  ? 'bg-primary text-surface' 
                  : 'border border-border-subtle text-secondary'
            }`} 
            aria-current={isCurrent ? "step" : undefined} 
            aria-label={`Step ${step} of ${total}`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
};

export default InterviewProgress;