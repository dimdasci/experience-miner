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
  placeholder = "Record your answer or type here"
}: TextInputProps) => {
  return (
    <div className={`
      transition-all duration-300 
      ${isActive ? 'ring-2 ring-blue-500' : ''} 
      ${disabled ? 'opacity-75' : ''} 
      rounded-lg
    `}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your Story:
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
          rows={6}
          disabled={disabled}
        />
        {value && !disabled && (
          <p className="text-xs text-gray-500">
            Story saved. Use navigation buttons below to continue.
          </p>
        )}
      </div>
    </div>
  );
};

export default TextInput;