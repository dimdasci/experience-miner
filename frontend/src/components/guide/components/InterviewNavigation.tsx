interface InterviewNavigationProps {
  onNext: () => void;
  isComplete: boolean;
  disabled: boolean;
}

const InterviewNavigation = ({ onNext, isComplete, disabled }: InterviewNavigationProps) => {
  return (
    <div className="flex-shrink-0 py-6 flex justify-end items-center">
      <button 
        onClick={onNext}
        disabled={disabled}
        className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50"
      >
        {isComplete ? 'Complete' : 'Next'}
      </button>
    </div>
  );
};

export default InterviewNavigation;