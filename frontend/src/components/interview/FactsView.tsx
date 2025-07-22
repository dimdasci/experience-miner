import { useState, useEffect } from 'react'
import { Building2, User, Briefcase, Award, Code, Target, Loader2, AlertCircle } from 'lucide-react'
import { apiService } from '../../services/apiService'
import { UserJourneyLogger } from '../../utils/logger'

interface ExtractedFacts {
  summary: string
  companies: string[]
  roles: Array<{
    company: string
    title: string
    duration?: string
  }>
  projects: Array<{
    name: string
    description: string
    role?: string
  }>
  achievements: string[]
  skills: string[]
}

interface FactsViewProps {
  sessionData: any[]
  onRestart: () => void
}

const FactsView: React.FC<FactsViewProps> = ({ sessionData, onRestart }) => {
  const [facts, setFacts] = useState<ExtractedFacts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Log when FactsView loads
  useEffect(() => {
    UserJourneyLogger.logNavigation('InterviewView', 'FactsView')
    UserJourneyLogger.logUserAction({
      action: 'facts_view_loaded',
      component: 'FactsView',
      data: { responsesCount: sessionData.length }
    })
  }, [])

  const handleProcessFacts = async () => {
    if (sessionData.length === 0) {
      setError('No interview responses to process')
      return
    }

    // Log extraction start
    UserJourneyLogger.logInterviewProgress({
      stage: 'extracting',
      data: { responsesCount: sessionData.length }
    })
    UserJourneyLogger.logUserAction({
      action: 'facts_extraction_started',
      component: 'FactsView',
      data: { responsesCount: sessionData.length }
    })

    setIsLoading(true)
    setError(null)

    try {
      // Combine all responses into a single transcript
      const combinedTranscript = sessionData
        .map(item => `Q: ${item.question}\nA: ${item.response}`)
        .join('\n\n')

      if (import.meta.env.DEV) {
        console.log('Processing transcript:', combinedTranscript)
      }
      
      const result = await apiService.extractFacts(combinedTranscript)
      
      if (result.success && result.responseObject) {
        setFacts(result.responseObject)
        
        // Log successful extraction
        UserJourneyLogger.logInterviewProgress({
          stage: 'completed',
          extractedFactsCount: Object.keys(result.responseObject).length
        })
        UserJourneyLogger.logUserAction({
          action: 'facts_extraction_completed',
          component: 'FactsView',
          data: {
            responsesCount: sessionData.length,
            extractedFacts: {
              companies: result.responseObject.companies?.length || 0,
              roles: result.responseObject.roles?.length || 0,
              projects: result.responseObject.projects?.length || 0,
              achievements: result.responseObject.achievements?.length || 0,
              skills: result.responseObject.skills?.length || 0
            }
          }
        })
      } else {
        setError(result.error || 'Failed to extract facts from your responses')
        UserJourneyLogger.logInterviewProgress({
          stage: 'error',
          errorMessage: result.error || 'Failed to extract facts'
        })
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Facts extraction error:', err)
      }
      setError('An error occurred while processing your responses')
      UserJourneyLogger.logError(err as Error, {
        action: 'facts_extraction_error',
        responsesCount: sessionData.length
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!facts && !isLoading && !error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Analyze Your Responses</h2>
          <p className="text-gray-600 mb-6">
            You've provided {sessionData.length} interview responses. Click the button below to extract and organize your career information using AI.
          </p>
          <button
            onClick={handleProcessFacts}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Extract Career Facts
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Your Responses...</h2>
          <p className="text-gray-600">
            Our AI is extracting and organizing your career information. This may take a few moments.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleProcessFacts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onRestart}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!facts) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-4">
            Unable to process your responses. Please try again.
          </p>
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Career Profile
        </h1>
        <p className="text-gray-600">
          Here's what we learned about your professional experience
        </p>
      </header>

      <div className="space-y-6">
        {/* Professional Summary */}
        {facts.summary && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Professional Summary</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{facts.summary}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Companies */}
          {facts.companies && facts.companies.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Companies</h2>
              </div>
              <div className="space-y-2">
                {facts.companies.map((company, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded border">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles */}
          {facts.roles && facts.roles.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold">Roles</h2>
              </div>
              <div className="space-y-3">
                {facts.roles.map((role, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded border">
                    <div className="font-medium">{role.title}</div>
                    <div className="text-sm text-gray-600">{role.company}</div>
                    {role.duration && (
                      <div className="text-xs text-gray-500">{role.duration}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Projects */}
          {facts.projects && facts.projects.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold">Projects</h2>
              </div>
              <div className="space-y-3">
                {facts.projects.map((project, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded border">
                    <div className="font-medium mb-1">{project.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {project.description}
                    </div>
                    {project.role && (
                      <div className="text-xs font-medium text-orange-700">
                        Role: {project.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {facts.skills && facts.skills.length > 0 && (
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {facts.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievements */}
        {facts.achievements && facts.achievements.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold">Key Achievements</h2>
            </div>
            <div className="space-y-2">
              {facts.achievements.map((achievement, index) => (
                <div key={index} className="p-3 bg-amber-50 rounded border flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Start New Interview
          </button>
          <button
            onClick={() => {
              // TODO: Implement export functionality
              const exportData = {
                timestamp: new Date().toISOString(),
                sessionData,
                extractedFacts: facts
              }
              if (import.meta.env.DEV) {
                console.log('Export data:', exportData)
              }
              // Could download as JSON file
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `career-profile-${new Date().toISOString().split('T')[0]}.json`
              a.click()
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default FactsView