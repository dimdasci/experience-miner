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
    <textarea
      className="w-full h-full bg-transparent p-6 border-0 focus:ring-0 focus:outline-none resize-none text-body-lg text-primary leading-relaxed"
      value={transcript}
      onChange={(e) => onTranscriptChange(e.target.value)}
      onBlur={onTranscriptBlur}
      aria-label="Your answer"
      placeholder="Start writing your answer..."
      disabled={isTranscribing}
    />
  );
};

export default StoryTextArea;