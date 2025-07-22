// api/quiz.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { QuizRequestSchema, type QuizQuestion, type QuizResponse } from "../shared/schema";
import { storage } from "../server/storage";
import { v4 as uuidv4 } from "uuid";
import { questions } from "../server/routes";

// inicializa OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { phase, questionIndex, answer, score, sessionId: providedSessionId } =
      QuizRequestSchema.parse(req.body);

    const sessionId = providedSessionId || uuidv4();

    // --- FLUXO QUIZ ---
    if (phase === "quiz") {
      const question = questions[questionIndex];
      if (!question) return res.status(404).json({ error: "Question not found" });

      // grava analytics da pergunta anterior
      if (answer !== undefined && questionIndex > 0) {
        const prev = questions[questionIndex - 1];
        await storage.saveQuizAnalytics({
          questionId:    prev.id,
          selectedAnswer: answer,
          correctAnswer:  prev.answer,
          isCorrect:      answer === prev.answer ? 1 : 0,
          level:          prev.level,
          sessionId
        });
      }

      const payload: QuizResponse = {
        question: question.question,
        options:  question.options
      };
      return res.status(200).json(payload);
    }

    // --- FLUXO FEEDBACK ---
    if (phase === "feedback") {
      // recupera todas as respostas salvas
      const analytics = await storage.getQuizAnalyticsBySession(sessionId);
      const totalCorrect = analytics.reduce((sum, a) => sum + a.isCorrect, 0);

      // determina nível
      let nivel = "A1";
      if (totalCorrect >= 31) nivel = "B2";
      else if (totalCorrect >= 21) nivel = "B1";
      else if (totalCorrect >= 11) nivel = "A2";

      // monta conteúdo de estudo
      const templates: Record<string,string> = {
        A1: `1. Reforce o uso de artigos (der/die/das, ein), Negação (nicht, kein), Präsens de sein/haben, Ordem S‑V‑O, Ja‑Nein‑Fragen e W‑Fragen.
2. Pratique vocabulário básico em contextos do dia a dia (saudações, apresentações).
3. Ouvir diálogos simples (Podcast Destravando seu Alemão), shadowing de frases básicas, memorizar 20 palavras novas/semana.`,
        A2: `1. Domine as diferenças entre Perfekt e Präteritum em narrativas cotidianas.
2. Casos acusativo vs. dativo, Perfekt (haben/sein + Partizip II), Verbos modais, Conjunções (und, aber, weil, dass), Imperativo.
3. Aprofunde o uso de conectores (zuerst, dann, danach), preposições de lugar e tempo em frases complexas.
4. Assistir séries infantis em alemão, role‑plays (comprar, combinar horários), mapas mentais de verbos e 10 expressões/dia.`,
        B1: `1. Trabalhe Konjunktiv II para hipóteses e pedidos polidos.
2. Pratique orações subordinadas com „weil\", „obwohl\" e „als ob\".
3. Pronomes relativos, Präteritum de sein/haben/gehen, Declinação de adjetivos.
4. Ouvir podcasts "Slow German", gravar áudios descrevendo o dia, anotar e usar 5 collocations/dia.`,
        B2: `1. Aplique Voz passiva e Modalpassiv, Partizipialkonstruktionen, Genitivo (wegen, trotz, während), Conjunções correlativas, Inversões estilísticas.
2. Expanda seu repertório com textos literários ou técnicos, participar de debates ou mini‑apresentações de 5 min, aprender 10 sinônimos/semana.`
      };

      const feedbackTemplate = `Você acertou ${totalCorrect} de 40 e seu nível estimado é **${nivel}**. Parabéns pelo resultado!

Para consolidar o que você já sabe e destravar de vez sua fala em alemão, aqui vão suas próximas etapas de estudo para o nível **${nivel}**:

${templates[nivel]}

Quer ir além com material completo, cronograma claro e acompanhamento diário no seu aprendizado? Entre no meu WhatsApp e garante uma condição especial para o Curso Completo de Alemão da Ovídio Academy:
https://wa.me/message/B7UCVV3XCPANK1

—
Estou te aguardando lá para te ajudar a alcançar fluência com metodologia acelerada e acompanhamento personalizado! 🎯🇩🇪`;

      // gera feedback customizado pela OpenAI
      let feedback = feedbackTemplate;
      try {
        const aiRes = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: feedbackTemplate }],
          max_tokens: 300,
          temperature: 0.7
        });
        feedback = aiRes.choices[0].message?.content || feedbackTemplate;
      } catch (err) {
        console.error("OpenAI Error:", err);
        // fallback: mantém feedbackTemplate
      }

      // salva resultado final
      const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      await storage.saveQuizResult({
        sessionId: sessionId,
        score:     totalCorrect,
        level:     nivel,
        feedback,
        answers:   analytics,
        ipAddress: String(ipAddress)
      });

      const resp: QuizResponse = { feedback };
      return res.status(200).json(resp);
    }

    return res.status(400).json({ error: "Invalid phase" });
  } catch (error) {
    console.error("Quiz API Error:", error);
    return res.status(400).json({ error: "Invalid request data" });
  }
}
