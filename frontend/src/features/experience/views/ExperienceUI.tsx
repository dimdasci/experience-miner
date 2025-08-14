import { AlertCircle } from 'lucide-react';
import { ExtractedFacts } from '@shared/types/business';
import { Button } from '@shared/components/ui/button';
import SectionHeader from '@shared/components/ui/section-header';
import Summary from '../elements/Summary';
import RolesList from '../elements/RolesList';

interface ExperienceUIProps {
  data: ExtractedFacts | null;
  loading: boolean;
  error: string | null;
  onRestart?: () => void;
  onExport?: () => void;
}

const ExperienceUI = ({ data, loading, error, onRestart, onExport }: ExperienceUIProps) => {
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <div className="text-gray-600">Loading experience data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRestart && (
          <Button onClick={onRestart}>Start New Interview</Button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h2 className="text-xl font-semibold mb-2">No Experience Data</h2>
        <p className="text-gray-600 mb-4">
          Complete an interview to start building your professional profile.
        </p>
        {onRestart && (
          <Button onClick={onRestart}>Start Interview</Button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SectionHeader 
        title="Your Professional Experience"
        subtitle={data.summary?.basedOnInterviews.length ? `Based on ${data.summary.basedOnInterviews.length} interviews` : "Here you will find insights from your career interviews"}
      />
      {onExport && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={onExport}>Export</Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Professional Summary */}
        {data.summary?.text && (
          <Summary 
            summaryText={data.summary.text}
            basedOnInterviews={data.summary.basedOnInterviews}
          />
        )}

        {/* Roles */}
        <RolesList roles={data.roles || []} />
      </div>
    </div>
  );
};

export default ExperienceUI;
