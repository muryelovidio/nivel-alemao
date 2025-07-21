import { quizResults, quizAnalytics, type InsertQuizResult, type InsertQuizAnalytics, type QuizResult, type QuizAnalytics } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  saveQuizAnalytics(analytics: InsertQuizAnalytics): Promise<QuizAnalytics>;
  getQuizResultsBySession(sessionId: string): Promise<QuizResult[]>;
  getQuizAnalyticsBySession(sessionId: string): Promise<QuizAnalytics[]>;
}

export class DatabaseStorage implements IStorage {
  async saveQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [savedResult] = await db
      .insert(quizResults)
      .values(result)
      .returning();
    return savedResult;
  }

  async saveQuizAnalytics(analytics: InsertQuizAnalytics): Promise<QuizAnalytics> {
    const [savedAnalytics] = await db
      .insert(quizAnalytics)
      .values(analytics)
      .returning();
    return savedAnalytics;
  }

  async getQuizResultsBySession(sessionId: string): Promise<QuizResult[]> {
    if (sessionId) {
      return await db
        .select()
        .from(quizResults)
        .where(eq(quizResults.sessionId, sessionId));
    }
    // Return all results if no sessionId provided (for admin)
    return await db.select().from(quizResults).limit(50);
  }

  async getQuizAnalyticsBySession(sessionId: string): Promise<QuizAnalytics[]> {
    if (sessionId) {
      return await db
        .select()
        .from(quizAnalytics)
        .where(eq(quizAnalytics.sessionId, sessionId));
    }
    // Return all analytics if no sessionId provided (for admin)
    return await db.select().from(quizAnalytics).limit(100);
  }
}

export const storage = new DatabaseStorage();
