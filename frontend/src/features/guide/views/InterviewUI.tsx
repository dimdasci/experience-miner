import RecorderUI from '../views/RecorderUI';
import SectionHeader from '../../ui/section-header';
import InterviewProgress from '../components/InterviewProgress';
import FocusedQuestion from '../components/FocusedQuestion';
import InterviewNavigation from '../components/InterviewNavigation';
import ErrorMessage from '../../ui/error-message';
import { RecordingState } from '../types/recordingTypes';
import { InterviewControls, VoiceControls, TextControls } from '../types/interviewTypes';
import { RefObject } from 'react';

interface InterviewUIProps {
  interview: InterviewControls;
  voice: VoiceControls;
  text: TextControls;
  saving: boolean;
  activeMode: 'voice' | 'text';
  recordingState: RecordingState;
  onRetry: () => void;
  onNext: () => void;
  onNavigate: (questionNumber: number) => void;
  textInputRef?: RefObject<HTMLTextAreaElement | null>;
}

const InterviewUI = ({
  interview,
  voice,
  text,
  saving,
  activeMode,
  recordingState,
  onRetry,
  onNext,
  onNavigate,
  textInputRef
}: InterviewUIProps) => {
  const { data: interviewData, answers, currentQuestionData, loading, error } = interview;
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary">Loading interview...</div>
        </div>
      </div>
    );
  }

  // Only treat errors as fatal if no question data is available (i.e. load errors)
  if (error && !currentQuestionData) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage 
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!currentQuestionData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-secondary">No interview data available.</div>
      </div>
    );
  }

  // Compute progress from interview data
  const currentQuestionNumber = currentQuestionData.question_number;
  const current = currentQuestionNumber;
  const total = answers.length;
  const isComplete = current >= total;

  return (
    <>
      {/* Header Section with proper spacing */}
      <div className="flex-shrink-0">
        <SectionHeader
          title={interviewData?.title || ''}
          subtitle="Track your progress through the interview process."
        />
        
        <InterviewProgress 
          current={current} 
          total={total} 
          answers={answers}
          onNavigate={error ? undefined : onNavigate}
          recordingState={recordingState}
        />
      </div>
      
      {/* Q&A Section that fills available space */}
      <div className="flex flex-col flex-grow min-h-0 pb-10">
        {/* Question */}
        <FocusedQuestion 
          question={currentQuestionData.question} 
          number={current}
          total={total}
        />
        
        {/* Recorder - now renders RecorderUI directly with grouped hook data */}
        <RecorderUI
          voice={voice}
          text={text}
          activeMode={activeMode}
          saving={saving}
          textInputRef={textInputRef}
        />
      </div>

      {/* Bottom controls: retry on save error, otherwise navigation */}
      {error ? (
        <div className="flex-shrink-0 py-6">
          {/* Match text section layout with left column space */}
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0 w-8"></div> {/* Empty left column to match "A" icon space */}
            <div className="flex-grow">
              <ErrorMessage
                message={error}
                onRetry={onRetry}
                retryText="Retry save"
              />
            </div>
          </div>
        </div>
      ) : (
        <InterviewNavigation
          onNext={onNext}
          isComplete={isComplete}
          disabled={false}  /* only block recording/transcribing */
          recordingState={recordingState}
        />
      )}
    </>

  );
};

export default InterviewUI;
