
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput = ({ 
 
  value, 
  onChange, 
  onFocus, 
  onBlur,
  disabled,
  placeholder = "Start writing your answer..."
}: TextInputProps) => {
  const containerClasses = 'w-full h-full rounded-lg bg-surface transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background focus-within:ring-accent';

  return (
    <div className={containerClasses}>
      <textarea
        className="w-full h-full bg-transparent p-6 border-0 focus:ring-0 focus:outline-none resize-none text-body-lg text-primary leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label="Your answer"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default TextInput;