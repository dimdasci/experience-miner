import { INTERVIEW_QUESTIONS, INTERVIEW_TOPICS, TOPIC_METADATA } from '../constants';

export interface Question {
  id: string;
  topic: string;
  text: string;
  order: number;
  followUp?: string[];
}

export interface TopicInfo {
  id: string;
  title: string;
  description: string;
  questionCount: number;
}

export class QuestionService {
  /**
   * Get all questions for a specific topic
   */
  static getQuestionsByTopic(topicId: string): Question[] {
    return INTERVIEW_QUESTIONS
      .filter(q => q.topic === topicId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get available topics with metadata
   */
  static getAvailableTopics(): TopicInfo[] {
    const guidTopics = [
      INTERVIEW_TOPICS.CAREER_OVERVIEW,
      INTERVIEW_TOPICS.KEY_ACHIEVEMENTS,
      INTERVIEW_TOPICS.CAREER_GOALS
    ];

    return guidTopics.map(topicId => ({
      id: topicId,
      title: TOPIC_METADATA[topicId]?.title || topicId,
      description: TOPIC_METADATA[topicId]?.description || '',
      questionCount: this.getQuestionsByTopic(topicId).length
    }));
  }

  /**
   * Get a specific question by index within a topic
   */
  static getQuestionByIndex(topicId: string, index: number): Question | null {
    const questions = this.getQuestionsByTopic(topicId);
    return questions[index] || null;
  }

  /**
   * Get progress information for a topic
   */
  static getTopicProgress(topicId: string, currentIndex: number): {
    current: number;
    total: number;
    percentage: number;
    isComplete: boolean;
  } {
    const questions = this.getQuestionsByTopic(topicId);
    const total = questions.length;
    const current = Math.min(currentIndex + 1, total);
    
    return {
      current,
      total,
      percentage: (current / total) * 100,
      isComplete: currentIndex >= total - 1
    };
  }

  /**
   * Get topic title by ID
   */
  static getTopicTitle(topicId: string): string {
    return TOPIC_METADATA[topicId as keyof typeof TOPIC_METADATA]?.title || topicId;
  }

  /**
   * Get all questions (for legacy compatibility)
   */
  static getAllQuestions(): Question[] {
    return INTERVIEW_QUESTIONS.sort((a, b) => a.order - b.order);
  }

  /**
   * Get question by ID (for legacy compatibility)
   */
  static getQuestionById(id: string): Question | null {
    return INTERVIEW_QUESTIONS.find(q => q.id === id) || null;
  }
}

export default QuestionService;