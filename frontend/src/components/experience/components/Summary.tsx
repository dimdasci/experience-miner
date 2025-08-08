import { User } from 'lucide-react';

interface SummaryProps {
  summaryText: string;
  basedOnInterviews: number[];
}

const Summary = ({ summaryText, basedOnInterviews }: SummaryProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Professional Summary</h2>
      </div>
      <p className="text-gray-700 leading-relaxed">{summaryText}</p>
      <div className="mt-3 text-xs text-gray-500">
        Based on {basedOnInterviews.length} interview(s)
      </div>
    </div>
  );
};

export default Summary;