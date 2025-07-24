import { useState, useEffect } from 'react';
import FactsView from '../interview/FactsView';

interface ExtractViewProps {
  onComplete: () => void;
}

const ExtractView = ({ onComplete }: ExtractViewProps) => {
  const [sessionData, setSessionData] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('interviewSession');
    if (session) {
      setSessionData(JSON.parse(session));
    }
  }, []);

  const handleRestart = () => {
    // Clear session data and return to topic selection
    localStorage.removeItem('interviewSession');
    localStorage.removeItem('selectedTopic');
    localStorage.removeItem('readyForExtraction');
    onComplete();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <FactsView 
        sessionData={sessionData} 
        onRestart={handleRestart}
      />
    </div>
  );
};

export default ExtractView;