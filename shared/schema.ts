import { z } from "zod";

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
