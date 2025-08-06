import { User, Briefcase, Target, AlertCircle, Calendar } from 'lucide-react';
import { ExtractedFacts } from '../../../types/business';
import { Button } from '../../ui/button';

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
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Professional Experience</h1>
        <p className="text-gray-600">
          Organized insights from your career interviews
        </p>
      </header>
      {onExport && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={onExport}>Export</Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Professional Summary */}
        {data.summary?.text && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Professional Summary</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{data.summary.text}</p>
            <div className="mt-3 text-xs text-gray-500">
              Based on {data.summary.basedOnInterviews.length} interview(s)
            </div>
          </div>
        )}

        {/* Roles */}
        {data.roles && data.roles.length > 0 && (
          <div className="space-y-6">
            {data.roles.map((role, i) => (
              <div key={i} className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold">{role.title}</h2>
                      <div className="text-lg text-gray-700">{role.company}</div>
                    </div>
                  </div>
                  {(role.start_year !== 'unknown' || role.end_year !== 'unknown') && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {role.start_year !== 'unknown' ? role.start_year : '?'} - {role.end_year !== 'unknown' ? role.end_year : '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Experience */}
                {role.experience && role.experience !== 'unknown' && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{role.experience}</p>
                  </div>
                )}

                {/* Projects */}
                {role.projects && role.projects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Projects</h3>
                    </div>
                    <div className="space-y-3">
                      {role.projects.map((proj, idx) => (
                        <div key={idx} className="p-4 bg-orange-50 rounded">
                          <div className="font-medium mb-2">{proj.name}</div>
                          <div className="text-sm text-gray-600 mb-3">{proj.goal}</div>
                          {proj.achievements && proj.achievements.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-orange-700 mb-2">Achievements:</div>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {proj.achievements.map((ach, aidx) => (
                                  <li key={aidx}>• {ach}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {role.skills && role.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {role.skills.map((skill, sidx) => (
                        <span key={sidx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceUI;
