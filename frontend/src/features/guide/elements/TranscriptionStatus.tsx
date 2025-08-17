import { Loader2 } from 'lucide-react';
import IconContentLayout from './IconContentLayout';

interface TranscriptionStatusProps {
  isTranscribing: boolean;
}

const TranscriptionStatus = ({ isTranscribing }: TranscriptionStatusProps) => {
  if (!isTranscribing) return null;

  return (
    <IconContentLayout 
      icon={<Loader2 className="h-5 w-5 p-1 text-secondary animate-spin" />}
    >
      <div className="flex items-center py-2">
        <span className="text-lg text-secondary">Transcribing audio...</span>
      </div>
    </IconContentLayout>
  );
};

export default TranscriptionStatus;