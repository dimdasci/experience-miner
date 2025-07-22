import * as Sentry from "@sentry/react";

interface UserActionLog {
  action: string;
  component?: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface InterviewProgressLog {
  stage: 'started' | 'recording' | 'transcribing' | 'extracting' | 'completed' | 'error';
  questionId?: string;
  duration?: number;
  errorMessage?: string;
  transcriptLength?: number;
  extractedFactsCount?: number;
  data?: Record<string, any>;
}

export class UserJourneyLogger {
  private static sessionId = crypto.randomUUID();
  private static startTime = Date.now();

  /**
   * Log general user actions for journey tracking
   */
  static logUserAction(params: UserActionLog) {
    const logData = {
      ...params,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
    };

    // Send to Sentry as structured log
    if (typeof Sentry.logger !== 'undefined') {
      Sentry.logger.info('User Action', logData);
    } else {
      // Fallback for older Sentry versions
      Sentry.captureMessage(`User Action: ${params.action}`, {
        level: 'info',
        tags: {
          action: params.action,
          component: params.component,
        },
        contexts: {
          userAction: logData
        }
      });
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('🎯 User Journey:', logData);
    }
  }

  /**
   * Log interview-specific progress for user flow analysis
   */
  static logInterviewProgress(params: InterviewProgressLog) {
    const logData = {
      ...params,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
    };

    if (typeof Sentry.logger !== 'undefined') {
      Sentry.logger.info('Interview Progress', logData);
    } else {
      Sentry.captureMessage(`Interview: ${params.stage}`, {
        level: params.stage === 'error' ? 'error' : 'info',
        tags: {
          stage: params.stage,
          questionId: params.questionId,
        },
        contexts: {
          interviewProgress: logData
        }
      });
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('📝 Interview Progress:', logData);
    }
  }

  /**
   * Log page navigation and user flow
   */
  static logNavigation(from: string, to: string, additionalData?: Record<string, any>) {
    this.logUserAction({
      action: 'navigation',
      component: 'Router',
      data: {
        from,
        to,
        ...additionalData
      }
    });
  }

  /**
   * Log errors with user context
   */
  static logError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      contexts: {
        userJourney: {
          sessionId: this.sessionId,
          sessionDuration: Date.now() - this.startTime,
          ...context
        }
      }
    });

    if (import.meta.env.DEV) {
      console.error('🚨 User Journey Error:', error, context);
    }
  }

  /**
   * Set user context for session tracking
   */
  static setUser(userId: string, userData?: Record<string, any>) {
    Sentry.setUser({
      id: userId,
      ...userData
    });

    this.logUserAction({
      action: 'user_identified',
      userId,
      data: userData
    });
  }

  /**
   * Add custom tags and context
   */
  static setContext(key: string, value: Record<string, any>) {
    Sentry.setContext(key, value);
  }
}