interface StoryTextAreaProps {
  transcript: string;
  isTranscribing: boolean;
  hasTranscript: boolean;
  onTranscriptChange: (value: string) => void;
  onTranscriptBlur: () => void;
}

const StoryTextArea = ({ 
  transcript, 
  isTranscribing, 
  hasTranscript, 
  onTranscriptChange, 
  onTranscriptBlur 
}: StoryTextAreaProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Your Story:
      </label>
      <textarea
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        onBlur={onTranscriptBlur}
        placeholder="Record your answer or type here"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={6}
        disabled={isTranscribing}
      />
      {hasTranscript && (
        <p className="text-xs text-gray-500">
          Story saved. Use navigation buttons below to continue.
        </p>
      )}
    </div>
  );
};

export default StoryTextArea;