// api/quiz.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { QuizRequestSchema, type QuizQuestion, type QuizResponse } from "../shared/schema";
import { storage } from "../server/storage";
import { v4 as uuidv4 } from "uuid";
import { questions } from "../server/routes";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { phase, questionIndex, answer, sessionId: providedSessionId } =
      QuizRequestSchema.parse(req.body);

    const sessionId = providedSessionId || uuidv4();

    // --- QUIZ PHASE ---
    if (phase === "quiz") {
      const question = questions[questionIndex];
      if (!question) return res.status(404).json({ error: "Question not found" });

      // store analytics of previous answer
      if (answer !== undefined && questionIndex > 0) {
        const prev = questions[questionIndex - 1];
        await storage.saveQuizAnalytics({
          questionId: prev.id,
          selectedAnswer: answer,
          correctAnswer: prev.answer,
          isCorrect: answer === prev.answer ? 1 : 0,
          level: prev.level,
          sessionId
        });
      }

      const payload: QuizResponse = {
        question: question.question,
        options: question.options
      };
      return res.status(200).json(payload);
    }

    // --- FEEDBACK PHASE ---
    if (phase === "feedback") {
      const analytics = await storage.getQuizAnalyticsBySession(sessionId);
      const totalCorrect = analytics.reduce((sum, a) => sum + a.isCorrect, 0);

      // determine level
      let level = "A1";
      if (totalCorrect >= 31) level = "B2";
      else if (totalCorrect >= 21) level = "B1";
      else if (totalCorrect >= 11) level = "A2";

      // static feedback templates
      const templates: Record<string, string> = {
        A1: `Você acertou ${totalCorrect} de 40. Nível estimado: A1.

Próximos passos:
1. Reforce artigos (der/die/das, ein), negação (nicht, kein), Präsens de sein/haben.
2. Pratique ordens S‑V‑O, perguntas sim/não e W‑Fragen.
3. Ouça diálogos simples e memorize 20 palavras novas por semana.`,
        A2: `Você acertou ${totalCorrect} de 40. Nível estimado: A2.

Próximos passos:
1. Estude Perfekt vs. Präteritum em narrativas.
2. Aprofunde casos acusativo e dativo, verbos modais e conjunções.
3. Pratique preposições de lugar/tempo e memorize 10 expressões por dia.`,
        B1: `Você acertou ${totalCorrect} de 40. Nível estimado: B1.

Próximos passos:
1. Trabalhe Konjunktiv II e orações subordinadas (weil, obwohl).
2. Pratique pronomes relativos e declinação de adjetivos.
3. Ouça podcasts "Slow German" e grave áudios descrevendo seu dia.`,
        B2: `Você acertou ${totalCorrect} de 40. Nível estimado: B2.

Próximos passos:
1. Aplique voz passiva, Partizipialkonstruktionen e Genitivo.
2. Participe de debates, apresente mini-talks e aprenda 10 sinônimos por semana.`
      };

      const feedback = templates[level];

      // save final result
      const ipAddress =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "unknown";
      await storage.saveQuizResult({
        sessionId,
        score: totalCorrect,
        level,
        feedback,
        answers: analytics,
        ipAddress
      });

      return res.status(200).json({ feedback });
    }

    return res.status(400).json({ error: "Invalid phase" });
  } catch (error) {
    console.error("Quiz API Error:", error);
    return res.status(400).json({ error: "Invalid request data" });
  }
}
