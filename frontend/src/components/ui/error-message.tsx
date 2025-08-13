interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

const ErrorMessage = ({ 
  message, 
  onRetry, 
  retryText = "Try again",
  className = "" 
}: ErrorMessageProps) => {
  return (
    <div className={`px-6 py-4 border border-accent bg-surface rounded-lg ${className}`}>
      <div className="text-primary">{message}</div>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-2 text-accent hover:text-accent/80 transition-colors focus-ring"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;