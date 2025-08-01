import { useState, useEffect, useCallback } from 'react'
import { Building2, User, Briefcase, Award, Code, Target, AlertCircle, Clock } from 'lucide-react'
import { apiService } from '../../services/apiService'
import { UserJourneyLogger } from '../../utils/logger'

interface ExtractedFacts {
  achievements: Array<{
    description: string
    sourceInterviewId: string
    sourceQuestionNumber: number
    extractedAt: string
  }>
  companies: Array<{
    name: string
    sourceInterviewId: string
    sourceQuestionNumber: number
    extractedAt: string
  }>
  projects: Array<{
    name: string
    description: string
    role: string
    company?: string
    sourceInterviewId: string
    sourceQuestionNumber: number
    extractedAt: string
  }>
  roles: Array<{
    title: string
    company: string
    duration: string
    sourceInterviewId: string
    sourceQuestionNumber: number
    extractedAt: string
  }>
  skills: Array<{
    name: string
    category?: string
    sourceInterviewId: string
    sourceQuestionNumber: number
    extractedAt: string
  }>
  summary: {
    text: string
    lastUpdated: string
    basedOnInterviews: string[]
  }
  metadata: {
    totalExtractions: number
    lastExtractionAt: string | null
    creditsUsed: number
  }
}

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
        setExperienceData(response.responseObject.extractedFacts)
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
        {experienceData.metadata.lastExtractionAt && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Last updated: {new Date(experienceData.metadata.lastExtractionAt).toLocaleDateString()}
          </div>
        )}
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Companies */}
          {experienceData.companies && experienceData.companies.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Companies</h2>
              </div>
              <div className="space-y-2">
                {experienceData.companies.map((company, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded border">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Interview {company.sourceInterviewId} • Q{company.sourceQuestionNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles */}
          {experienceData.roles && experienceData.roles.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold">Roles</h2>
              </div>
              <div className="space-y-3">
                {experienceData.roles.map((role, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded border">
                    <div className="font-medium">{role.title}</div>
                    <div className="text-sm text-gray-600">{role.company}</div>
                    {role.duration && (
                      <div className="text-xs text-gray-500">{role.duration}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Interview {role.sourceInterviewId} • Q{role.sourceQuestionNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Projects */}
          {experienceData.projects && experienceData.projects.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold">Projects</h2>
              </div>
              <div className="space-y-3">
                {experienceData.projects.map((project, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded border">
                    <div className="font-medium mb-1">{project.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {project.description}
                    </div>
                    {project.role && (
                      <div className="text-xs font-medium text-orange-700 mb-1">
                        Role: {project.role}
                      </div>
                    )}
                    {project.company && (
                      <div className="text-xs text-gray-600 mb-1">
                        Company: {project.company}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Interview {project.sourceInterviewId} • Q{project.sourceQuestionNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {experienceData.skills && experienceData.skills.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {experienceData.skills.map((skill, index) => (
                  <div key={index} className="group relative">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full cursor-help">
                      {skill.name}
                    </span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Interview {skill.sourceInterviewId} • Q{skill.sourceQuestionNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        {experienceData.achievements && experienceData.achievements.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold">Key Achievements</h2>
            </div>
            <div className="space-y-2">
              {experienceData.achievements.map((achievement, index) => (
                <div key={index} className="p-3 bg-amber-50 rounded border flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm">{achievement.description}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      Interview {achievement.sourceInterviewId} • Q{achievement.sourceQuestionNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata and Action Buttons */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Experience Summary</h3>
              <div className="text-sm text-gray-600 mt-1">
                {experienceData.metadata.totalExtractions} extraction(s) • {experienceData.metadata.creditsUsed} credits used
              </div>
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