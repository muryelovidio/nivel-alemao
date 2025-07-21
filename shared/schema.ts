import { z } from "zod";
import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Quiz results table for storing user quiz attempts
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  score: integer("score").notNull(),
  level: text("level").notNull(),
  feedback: text("feedback"),
  answers: jsonb("answers").notNull(), // Array of user answers
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Analytics table for tracking quiz performance
export const quizAnalytics = pgTable("quiz_analytics", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  selectedAnswer: text("selected_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  isCorrect: integer("is_correct").notNull(), // 0 or 1 for boolean
  level: text("level").notNull(),
  sessionId: text("session_id").notNull(),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

// Define relations
export const quizResultsRelations = relations(quizResults, ({ many }) => ({
  analytics: many(quizAnalytics),
}));

export const quizAnalyticsRelations = relations(quizAnalytics, ({ one }) => ({
  result: one(quizResults, {
    fields: [quizAnalytics.sessionId],
    references: [quizResults.sessionId],
  }),
}));

// Zod schemas for validation
export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export const insertQuizAnalyticsSchema = createInsertSchema(quizAnalytics).omit({
  id: true,
  answeredAt: true,
});

// Types
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizAnalytics = typeof quizAnalytics.$inferSelect;
export type InsertQuizAnalytics = z.infer<typeof insertQuizAnalyticsSchema>;

// Original quiz question schema (kept for frontend compatibility)
export const QuizQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.array(z.string()).length(3),
  answer: z.enum(["A", "B", "C"]),
  level: z.enum(["A1", "A2", "B1", "B2"]),
});

export const QuizRequestSchema = z.object({
  phase: z.enum(["quiz", "feedback"]),
  questionIndex: z.number().min(0).max(39),
  answer: z.enum(["A", "B", "C"]).optional(),
  score: z.number().min(0).max(40),
  sessionId: z.string().optional(),
});

export const QuizResponseSchema = z.object({
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  feedback: z.string().optional(),
  isCorrect: z.boolean().optional(),
  correctAnswer: z.enum(["A", "B", "C"]).optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizRequest = z.infer<typeof QuizRequestSchema>;
export type QuizResponse = z.infer<typeof QuizResponseSchema>;
