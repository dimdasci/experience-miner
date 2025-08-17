import { Loader2 } from 'lucide-react';

interface TranscriptionStatusProps {
  isTranscribing: boolean;
}

const TranscriptionStatus = ({ isTranscribing }: TranscriptionStatusProps) => {
  if (!isTranscribing) return null;

  return (
    <div className="flex items-center md:space-x-6">
      <div className="hidden md:flex flex-shrink-0 w-7 justify-center">
        <Loader2 className="h-5 w-5 p-1 text-secondary animate-spin" />
      </div>
      <div className="flex-grow">
        <div className="flex items-center py-2">
          <span className="text-lg text-secondary">Transcribing audio...</span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionStatus;