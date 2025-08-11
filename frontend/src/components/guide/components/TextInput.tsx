interface TextInputProps {
  isActive: boolean;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput = ({ 
  isActive, 
  value, 
  onChange, 
  onFocus, 
  disabled,
  placeholder = "Start writing your answer..."
}: TextInputProps) => {
  return (
    <textarea
      className="w-full h-full bg-transparent p-6 border-0 focus:ring-0 focus:outline-none resize-none text-body-lg text-primary leading-relaxed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      aria-label="Your answer"
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default TextInput;