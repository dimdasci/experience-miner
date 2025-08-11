import RecorderUI from '../views/RecorderUI';
import { Answer } from '../../../types/business';
import SectionHeader from '../../ui/section-header';
import InterviewProgress from '../components/InterviewProgress';
import QuestionAnswerPair from '../components/QuestionAnswerPair';
import FocusedQuestion from '../components/FocusedQuestion';
import InterviewNavigation from '../components/InterviewNavigation';
import ErrorMessage from '../../ui/error-message';
import { RecordingState } from '../types/recordingTypes';

interface Progress {
  current: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

interface InterviewUIProps {
  loading: boolean;
  error: string | null;
  saving: boolean;
  interviewTitle: string;
  currentQuestionData?: Answer;
  progress: Progress;
  recordingState: RecordingState;
  onRetry: () => void;
  onNext: () => void;
  onNavigate: (questionNumber: number) => void;
  onDataUpdate: (data: any) => void;
  // Hook containing all recording functionality
  interviewHook: any; // TODO: Type this properly with the return type of useInterview
}

const InterviewUI = ({
  loading,
  error,
  saving,
  interviewTitle,
  currentQuestionData,
  progress,
  recordingState,
  onRetry,
  onNext,
  onNavigate,
  onDataUpdate,
  interviewHook
}: InterviewUIProps) => {
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

  return (
    <>
      {/* Header Section with proper spacing */}
      <div className="flex-shrink-0">
        <SectionHeader
          title={interviewTitle}
          subtitle="Track your progress through the interview process."
        />
        
        <InterviewProgress 
          current={progress.current} 
          total={progress.total} 
          percentage={progress.percentage}
          answers={interviewHook.answers || []}
          onNavigate={error ? undefined : onNavigate}
          recordingState={recordingState}
        />
      </div>
      
      {/* Q&A Section that fills available space */}
      <div className="flex flex-col flex-grow min-h-0 pb-10">
        {/* Question */}
        <FocusedQuestion 
          question={currentQuestionData.question} 
          number={progress.current}
          total={progress.total}
        />
        
        {/* Recorder - now renders RecorderUI directly with unified hook data */}
        <RecorderUI
          // Voice props from unified hook
          transcript={interviewHook.transcript}
          isTranscribing={interviewHook.isTranscribing}
          isRecording={interviewHook.isRecording}
          recordingDuration={interviewHook.recordingDuration}
          isSupported={interviewHook.isSupported}
          error={interviewHook.audioError}
          hasTranscript={interviewHook.hasTranscript}
          onStartRecording={interviewHook.handleVoiceStart}
          onPauseRecording={interviewHook.handlePauseRecording}
          onStopRecording={interviewHook.handleStopRecording}
          onTranscriptChange={() => {}} // Not used in unified approach
          onTranscriptBlur={() => {}} // Not used in unified approach
          // Text props from unified hook
          textValue={interviewHook.textValue}
          onTextChange={interviewHook.handleTextChange}
          onTextFocus={interviewHook.handleTextFocus}
          onTextBlur={interviewHook.handleTextBlur}
          // State props
          activeMode={interviewHook.activeMode}
        />
      </div>

      {/* Inline save feedback during text auto-save */}
      {saving && interviewHook.activeMode === 'text' && (
        <p className="text-xs text-gray-500 mb-4">Saving…</p>
      )}
      {/* Bottom controls: retry on save error, otherwise navigation */}
      {error ? (
        <ErrorMessage
          message={error}
          onRetry={onRetry}
          retryText="Retry save"
          className="mb-4"
        />
      ) : (
        <InterviewNavigation
          onNext={onNext}
          isComplete={progress.isComplete}
          disabled={false}  /* only block recording/transcribing */
          recordingState={recordingState}
        />
      )}
    </>

  );
};

export default InterviewUI;
