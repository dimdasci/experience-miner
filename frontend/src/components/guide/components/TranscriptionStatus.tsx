import { Loader2 } from 'lucide-react';

interface TranscriptionStatusProps {
  isTranscribing: boolean;
}

const TranscriptionStatus = ({ isTranscribing }: TranscriptionStatusProps) => {
  if (!isTranscribing) return null;

  return (
    <div className="flex items-center justify-center space-x-2 text-blue-600">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Transcribing audio...</span>
    </div>
  );
};

export default TranscriptionStatus;