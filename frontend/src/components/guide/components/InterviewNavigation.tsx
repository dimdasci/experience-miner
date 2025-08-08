import { Button } from '../../ui/button';

interface InterviewNavigationProps {
  onNext: () => void;
  isComplete: boolean;
  disabled: boolean;
}

const InterviewNavigation = ({ onNext, isComplete, disabled }: InterviewNavigationProps) => {
  return (
    <div className="flex justify-end">
      <Button onClick={onNext} disabled={disabled}>
        {isComplete ? 'Finish' : 'Next'}
      </Button>
    </div>
  );
};

export default InterviewNavigation;