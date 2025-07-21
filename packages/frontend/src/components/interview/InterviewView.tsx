import { useState } from 'react'
import Recorder from './Recorder'
import FactsView from './FactsView'

const InterviewView = () => {
  const [sessionData, setSessionData] = useState<any[]>([])
  const [showFacts, setShowFacts] = useState(false)

  const handleSessionComplete = () => {
    // Show facts view after interview completion
    setShowFacts(true)
  }

  const handleDataUpdate = (data: any) => {
    setSessionData(prev => [...prev, data])
  }

  const handleRestart = () => {
    setSessionData([])
    setShowFacts(false)
  }

  // Show facts view if session is completed
  if (showFacts) {
    return <FactsView sessionData={sessionData} onRestart={handleRestart} />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Experience Miner
        </h1>
        <p className="text-gray-600 text-lg">
          AI-powered career interview to extract and organize your professional experiences
        </p>
      </header>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Career Interview Session</h2>
            <p className="text-gray-600 mb-6">
              Let's discuss your career experiences. You can speak or type your responses.
            </p>
          </div>

          <Recorder 
            onDataUpdate={handleDataUpdate}
            onSessionComplete={handleSessionComplete}
          />

          {sessionData.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Session Progress ({sessionData.length} responses)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessionData.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border text-sm">
                    {item.question && (
                      <div className="font-medium text-gray-900 mb-1">
                        Q: {item.question}
                      </div>
                    )}
                    {item.response && (
                      <div className="text-gray-600">
                        A: {item.response.substring(0, 200)}
                        {item.response.length > 200 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterviewView