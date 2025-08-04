import { useState, useEffect, useCallback } from 'react'
import { User, Briefcase, Target, AlertCircle, Calendar } from 'lucide-react'
import { apiService } from '../../services/apiService'
import { UserJourneyLogger } from '../../utils/logger'
import { ExtractedFacts, ProfessionalSummary } from '../../types/business'

interface ExperienceViewProps {
  onRestart?: () => void
}

const ExperienceView: React.FC<ExperienceViewProps> = ({ 
  onRestart
}) => {
  const [experienceData, setExperienceData] = useState<ExtractedFacts | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load existing experience data
  const loadExperienceData = useCallback(async () => {
    try {
      setError(null)
      const response = await apiService.getExperienceData()
      
      if (response.success) {
        const professionalSummary = response.responseObject as ProfessionalSummary;
        setExperienceData(professionalSummary.extractedFacts);
      } else {
        // Special handling for duplicate requests - don't treat as errors
        if (response.isDuplicate || response.statusCode === 429) {
          console.log('Duplicate experience data request detected - waiting for original request');
          return; // Just wait for the original request to complete
        } else {
          setError(response.message || 'Failed to load experience data')
        }
      }
    } catch (err) {
      setError('Failed to load experience data')
      // Track experience loading errors
      UserJourneyLogger.logError(err as Error, {
        action: 'experience_loading_failed',
        component: 'ExperienceView'
      })
      
    }
  }, [])


  // Load experience data when component mounts
  useEffect(() => {
    loadExperienceData()
  }, [loadExperienceData])

  // Log when ExperienceView loads
  useEffect(() => {
    UserJourneyLogger.logNavigation('InterviewView', 'ExperienceView')
    UserJourneyLogger.logUserAction({
      action: 'experience_view_loaded',
      component: 'ExperienceView'
    })
  }, [])


  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            {onRestart && (
              <button
                onClick={onRestart}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Start New Interview
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no experience data
  if (!experienceData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Experience Data</h2>
          <p className="text-gray-600 mb-4">
            Complete an interview to start building your professional profile.
          </p>
          {onRestart && (
            <button
              onClick={onRestart}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Interview
            </button>
          )}
        </div>
      </div>
    )
  }

  // Main experience display
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Professional Experience
        </h1>
        <p className="text-gray-600">
          Organized insights from your career interviews
        </p>
      </header>

      <div className="space-y-6">
        {/* Professional Summary */}
        {experienceData.summary?.text && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Professional Summary</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{experienceData.summary.text}</p>
            <div className="mt-3 text-xs text-gray-500">
              Based on {experienceData.summary.basedOnInterviews.length} interview(s)
            </div>
          </div>
        )}

        {/* Roles */}
        {experienceData.roles && experienceData.roles.length > 0 && (
          <div className="space-y-6">
            {experienceData.roles.map((role, roleIndex) => (
              <div key={roleIndex} className="bg-white rounded-lg border shadow-sm p-6">
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

                {/* Projects for this role */}
                {role.projects && role.projects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Projects</h3>
                    </div>
                    <div className="space-y-3">
                      {role.projects.map((project, projectIndex) => (
                        <div key={projectIndex} className="p-4 bg-orange-50 rounded">
                          <div className="font-medium mb-2">{project.name}</div>
                          <div className="text-sm text-gray-600 mb-3">{project.goal}</div>
                          {project.achievements && project.achievements.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-orange-700 mb-2">Achievements:</div>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {project.achievements.map((achievement, achIndex) => (
                                  <li key={achIndex}>• {achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills for this role */}
                {role.skills && role.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {role.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Sources: {role.sources.map((source, idx) => (
                      <span key={idx}>
                        Interview {source.interview_id} • Q{source.question_number}
                        {idx < role.sources.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center mb-4">
            <h3 className="font-medium text-gray-900">Experience Summary</h3>
            <div className="text-sm text-gray-600 mt-1">
              {experienceData.roles.length} role(s) • {experienceData.summary.basedOnInterviews.length} interview(s)
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            {onRestart && (
              <button
                onClick={onRestart}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Start New Interview
              </button>
            )}
            <button
              onClick={() => {
                // Export functionality
                const exportData = {
                  timestamp: new Date().toISOString(),
                  experienceData
                }
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `professional-experience-${new Date().toISOString().split('T')[0]}.json`
                a.click()
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExperienceView