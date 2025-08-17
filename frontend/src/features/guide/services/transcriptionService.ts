import { apiService } from '@shared/services/apiService';
import { UserJourneyLogger } from '@shared/utils/logger';

export interface TranscriptionRequest {
  recording: { blob: Blob; duration: number };
  question: string;
  interviewId: number;
  questionNumber: number;
}

export interface TranscriptionCallbacks {
  onTranscriptionStart: () => void;
  onTranscriptionSuccess: (transcript: string, duration: number) => Promise<void>;
  onTranscriptionComplete: () => void;
  onCreditsUpdate: () => void;
}

export class TranscriptionService {
  static async processRecording(
    request: TranscriptionRequest,
    callbacks: TranscriptionCallbacks
  ): Promise<void> {
    const { recording, question, interviewId, questionNumber } = request;
    const { onTranscriptionStart, onTranscriptionSuccess, onTranscriptionComplete, onCreditsUpdate } = callbacks;

    // Log recording completion
    UserJourneyLogger.logInterviewProgress({
      stage: 'transcribing',
      questionId: String(questionNumber),
      duration: recording.duration
    });

    onTranscriptionStart();

    try {
      const result = await apiService.transcribeAudio(
        recording.blob,
        question,
        interviewId,
        questionNumber,
        recording.duration
      );

      if (result.success && result.responseObject) {
        // Backend returns the transcript as a string directly in responseObject
        const transcriptText = String(result.responseObject);

        // Auto-submit the response immediately after transcription
        await onTranscriptionSuccess(transcriptText, recording.duration);

        // Update credits in the global context by refreshing from the server
        onCreditsUpdate();

        // Log successful transcription and auto-submission
        UserJourneyLogger.logUserAction({
          action: 'transcription_completed',
          component: 'transcriptionService',
          data: {
            questionId: String(questionNumber),
            transcriptLength: transcriptText.length,
            duration: recording.duration
          }
        });
      } else {
        // Track transcription API failures
        UserJourneyLogger.logError(new Error(result.message || 'Transcription failed'), {
          action: 'transcription_api_failed',
          component: 'transcriptionService',
          questionId: String(questionNumber),
          statusCode: result.statusCode
        });

        // Handle specific error types
        if (result.statusCode === 402) {
          alert('Not enough credits to process this request. Please purchase more credits.');
        } else if (result.statusCode === 409) {
          alert('Another operation is in progress, please wait and try again.');
        }

        UserJourneyLogger.logInterviewProgress({
          stage: 'error',
          questionId: String(questionNumber),
          errorMessage: result.message || 'Transcription failed',
          data: { statusCode: result.statusCode }
        });
      }
    } catch (error) {
      // Track transcription errors
      UserJourneyLogger.logError(error as Error, {
        action: 'transcription_error',
        component: 'transcriptionService',
        questionId: String(questionNumber)
      });
    } finally {
      onTranscriptionComplete();
    }
  }
}