import { ExtractedFacts } from '@shared/types/business';
import { Button } from '@shared/components/ui/button';
import SectionHeader from '@shared/components/ui/section-header';
import Summary from '../elements/Summary';
import RolesList from '../elements/RolesList';
import ErrorMessage from '@shared/components/ui/error-message';

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
      <div className="text-center">
        <div className="text-secondary">Loading experience data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">No Experience Data</h2>
        <p className="text-secondary mb-4">
          Complete an interview to start building your professional profile.
        </p>
        {onRestart && (
          <Button onClick={onRestart}>Go to Guide</Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <SectionHeader 
          title="Your Professional Experience"
          subtitle={data.summary?.basedOnInterviews.length ? `Based on ${data.summary.basedOnInterviews.length} interviews` : "Here you will find insights from your career interviews"}
        />
        {error && (
          <div className="mt-12">
            <ErrorMessage 
              message={error}
              onRetry={onRestart}
              className="mx-6 mb-8"
            />
          </div>
        )}
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-10"></div>
      
      {/* Scrollable Content */}
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto">
        <div>
          <div className="space-y-6 md:space-y-10">
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
      </div>
      
      {/* Fixed Spacer */}
      <div className="flex-shrink-0 h-2 md:h-10"></div>
      
      {/* Fixed Footer - Export Button */}
      {onExport && (
        <div className="flex-shrink-0 py-6 flex justify-center items-center">
          <Button onClick={onExport}>Export</Button>
        </div>
      )}
    </div>
  );
};

export default ExperienceUI;
