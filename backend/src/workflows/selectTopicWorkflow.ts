import type { ITopicRepository } from "@/repositories/interfaces/ITopicRepository";
import type { IInterviewRepository } from "@/repositories/interfaces/IInterviewRepository";
import type { IAnswerRepository } from "@/repositories/interfaces/IAnswerRepository";
import type { IDatabaseProvider, DatabaseClient } from "@/providers";
import type { Interview, Answer } from "@/types/domain";

export class SelectTopicWorkflow {
  private topicRepository: ITopicRepository;
  private interviewRepository: IInterviewRepository;
  private answerRepository: IAnswerRepository;
  private databaseProvider: IDatabaseProvider;

  constructor(
    topicRepository: ITopicRepository,
    interviewRepository: IInterviewRepository,
    answerRepository: IAnswerRepository,
    databaseProvider: IDatabaseProvider,
  ) {
    this.topicRepository = topicRepository;
    this.interviewRepository = interviewRepository;
    this.answerRepository = answerRepository;
    this.databaseProvider = databaseProvider;
  }

  async execute(userId: string, topicId: number): Promise<{ interview: Interview; answers: Answer[] }> {
    // Read topic details before starting transaction

    // 1. Verify topic exists and is available
    const topic = await this.topicRepository.getById(userId, topicId);
    if (!topic) throw new Error("Topic not found");
    if (topic.status !== "available") throw new Error("Topic is not available");

    // Execute as transaction to ensure atomicity
    return await this.databaseProvider.transaction(async (client: DatabaseClient) => {
      // 1. Mark topic as used
      await this.topicRepository.markAsUsed(userId, topicId, client);

      // 2. Create interview
      const interview = await this.interviewRepository.create(
        userId,
        topic.title,
        topic.motivational_quote,
        client,
      );

      // 4. Create answer records
      const answers: Answer[] = [];
      const questions = Array.isArray(topic.questions) ? topic.questions : [];
      for (const question of questions) {
        const answer = await this.answerRepository.create(
          interview.id,
          userId,
          question.order,
          question.text,
          client
        );
        answers.push(answer);
      }

      return { interview, answers };
    });
  }
}
