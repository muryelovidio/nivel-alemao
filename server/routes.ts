import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { QuizRequestSchema, type QuizQuestion, type QuizResponse } from "@shared/schema";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// German language quiz questions - 40 authentic questions organized by CEFR levels
const questions: QuizQuestion[] = [
  // A1 Level Questions (0-9)
  { id: 0, question: "Wie heißt du?", options: ["Ich heißen Maria", "Ich heiße Maria", "Ich heißt Maria"], answer: "B", level: "A1" },
  { id: 1, question: "Wo wohnst du?", options: ["Ich wohne in Berlin", "Ich wohne aus Berlin", "Ich wohnen in Berlin"], answer: "A", level: "A1" },
  { id: 2, question: "Was ist das?", options: ["Das ist Buch", "Das sind ein Buch", "Das ist ein Buch"], answer: "C", level: "A1" },
  { id: 3, question: "Wie alt bist du?", options: ["Ich bin zwanzig Jahre alt", "Ich habe zwanzig", "Ich werde zwanzig"], answer: "A", level: "A1" },
  { id: 4, question: "Woher kommst du?", options: ["Ich komme nach Deutschland", "Ich komme aus Brasilien", "Ich komme von Brasilien"], answer: "B", level: "A1" },
  { id: 5, question: "Was machst du beruflich?", options: ["Ich bin Lehrer", "Ich bin arbeiten Lehrer", "Ich arbeite wie Lehrer"], answer: "A", level: "A1" },
  { id: 6, question: "Wann stehst du auf?", options: ["Ich stehe um 7 Uhr auf", "Ich stehe auf um 7 Uhr", "Ich stehen um 7 Uhr auf"], answer: "A", level: "A1" },
  { id: 7, question: "Welche Farbe hat das Auto?", options: ["Das Auto hat rot", "Das Auto ist rot", "Das Auto ist rotes"], answer: "B", level: "A1" },
  { id: 8, question: "Wo ist der Schlüssel?", options: ["Der Schlüssel liegt auf dem Tisch", "Der Schlüssel liegen auf dem Tisch", "Der Schlüssel liegt aus dem Tisch"], answer: "A", level: "A1" },
  { id: 9, question: "Was kostet das Brot?", options: ["Das Brot kostet zwei Euro", "Das Brot kostest zwei Euro", "Das Brot hat zwei Euro"], answer: "A", level: "A1" },

  // A2 Level Questions (10-19)
  { id: 10, question: "Was möchtest du kaufen?", options: ["Ich möchte ein Computer kaufen", "Ich möchte eine Computer Kaufen", "Ich möchte einen Computer kaufen"], answer: "C", level: "A2" },
  { id: 11, question: "Wie ist das Wetter heute?", options: ["Das Wetter ist schöne und sonnige", "Das Wetter ist schön und sonnig", "Das Wetter scheint die Sonne"], answer: "B", level: "A2" },
  { id: 12, question: "Was hast du gestern gemacht?", options: ["Ich habe gesehen einen Film", "Ich sehe einen Film", "Ich habe einen Film gesehen"], answer: "C", level: "A2" },
  { id: 13, question: "Warum lernst du Deutsch?", options: ["Weil ich in Deutschland leben", "weil ich in Deutschland lebe", "Wenn ich lebe in Deutschland"], answer: "B", level: "A2" },
  { id: 14, question: "Kannst du mir helfen?", options: ["Ja, natürlich kann ich dir helfen", "Ja, natürlich ich kann dir helfen", "Ja, ich kann helfen dir"], answer: "A", level: "A2" },
  { id: 15, question: "Wann fährt der nächste Zug?", options: ["Der nächste Zug fährt am 15:30", "Der nächste Zug fährt um 15:30", "Der nächste Zug fährt im 15:30"], answer: "B", level: "A2" },
  { id: 16, question: "Was für Musik hörst du gern?", options: ["Ich höre gern klassische Musik", "Ich gern hören klassische Musik", "Ich mag klassische Musik hören"], answer: "A", level: "A2" },
  { id: 17, question: "Wie lange lernst du schon Deutsch?", options: ["Ich lerne vor zwei Jahren Deutsch", "Ich lerne in zwei Jahren Deutsch", "Ich lerne seit zwei Jahren Deutsch"], answer: "C", level: "A2" },
  { id: 18, question: "Was würdest du gern machen?", options: ["Ich würde gern nach Deutschland reisen", "Ich würden gern reisen nach Deutschland", "Ich würde nach Deutschland gern reisen"], answer: "A", level: "A2" },
  { id: 19, question: "Wo warst du letztes Wochenende?", options: ["Ich war bei meinen Freunden", "Ich war in meinen Freunden", "Ich war zu meinen Freunden"], answer: "B", level: "A2" },

  // B1 Level Questions (20-29)
  { id: 20, question: "Wenn ich Zeit hätte, _____ ich mehr reisen.", options: ["werde", "würde", "will"], answer: "B", level: "B1" },
  { id: 21, question: "Das ist der Mann, _____ das Auto gestohlen hat.", options: ["der", "den", "dem"], answer: "A", level: "B1" },
  { id: 22, question: "Obwohl es regnet, _____ spazieren.", options: ["wir gehen", "gehen wir", "sind wir"], answer: "B", level: "B1" },
  { id: 23, question: "Er tut so, _____ er alles wüsste.", options: ["wie", "dass", "als ob"], answer: "C", level: "B1" },
  { id: 24, question: "Das Buch, _____ ich dir empfohlen habe, ist sehr interessant.", options: ["das", "den", "dem"], answer: "A", level: "B1" },
  { id: 25, question: "_____ des schlechten Wetters sind wir gegangen.", options: ["Wegen", "Trotz", "Während"], answer: "B", level: "B1" },
  { id: 26, question: "Sie arbeitet hart, _____ erfolgreich zu sein.", options: ["um", "damit", "dass"], answer: "A", level: "B1" },
  { id: 27, question: "Nachdem er gegessen _____, ging er schlafen.", options: ["hat", "hatte", "war"], answer: "B", level: "B1" },
  { id: 28, question: "Das Projekt _____ bis morgen fertig sein.", options: ["hat", "braucht", "muss"], answer: "C", level: "B1" },
  { id: 29, question: "Je mehr er lernt, _____ besser wird er.", options: ["desto", "als", "wie"], answer: "A", level: "B1" },

  // B2 Level Questions (30-39)
  { id: 30, question: "Der Politiker, _____ Rede gestern gehalten wurde, ist sehr umstritten.", options: ["dessen", "deren", "dem"], answer: "A", level: "B2" },
  { id: 31, question: "Hätte ich das gewusst, _____ ich anders gehandelt.", options: ["wäre", "hätte", "würde"], answer: "B", level: "B2" },
  { id: 32, question: "____ nicht übt, wird nie besser.", options: ["Wen", "wer", "wem"], answer: "B", level: "B2" },
  { id: 33, question: "Er sagt: „Ich komme morgen.“ → „Er sagt, er ____ morgen.", options: ["kommt", "komme", "kommen"], answer: "B", level: "B2" },
  { id: 34, question: "Die Angelegenheit _____ einer gründlichen Untersuchung.", options: ["bedarf", "braucht", "benötigt"], answer: "A", level: "B2" },
  { id: 35, question: "Der Mann, ____ den Hund Gassi führt, ist mein Nachbar.", options: ["dem", "dessen", "der"], answer: "C", level: "B2" },
  { id: 36, question: "Das ____ sich kaum anders lösen.", options: ["lässt", "kann", "soll"], answer: "A", level: "B2" },
  { id: 37, question: "gestern / wegen der Arbeit / habe ich / zu Hause / viel gearbeitet.", options: ["ich habe gestern zu Hause wegen der Arbeit viel gearbeitet", "ich habe zu Hause gestern wegen der Arbeit viel gearbeitet", "ich habe wegen der Arbeit gestern zu Hause viel gearbeitet"], answer: "A", level: "B2" },
  { id: 38, question: "Nominalisierung: Die (entscheiden) ____ fällt mir schwer.", options: ["Entscheiden", "Entscheidung", "Entscheidend"], answer: "B", level: "B2" },
  { id: 39, question: "Er spricht ____ Deutsch, ____ Englisch fließend.", options: ["einerseits ... andererseits", "sowohl ... als auch", "entweder... oder"], answer: "B", level: "B2" }
];

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/quiz", async (req, res) => {
    try {
      const validatedData = QuizRequestSchema.parse(req.body);
      const { phase, questionIndex, answer, score, sessionId: providedSessionId } = validatedData;
      
      // Generate or use provided session ID
      const sessionId = providedSessionId || uuidv4();

      if (phase === "quiz") {
        // Return question data
        const question = questions[questionIndex];
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        // If answer provided, save analytics for the previous question
        if (answer !== undefined && questionIndex > 0) {
          const prevQuestion = questions[questionIndex - 1];
          const isCorrect = answer === prevQuestion.answer;
          
          try {
            await storage.saveQuizAnalytics({
              questionId: prevQuestion.id,
              selectedAnswer: answer,
              correctAnswer: prevQuestion.answer,
              isCorrect: isCorrect ? 1 : 0,
              level: prevQuestion.level,
              sessionId: sessionId,
            });
          } catch (error) {
            console.error("Error saving analytics:", error);
          }
        }

        const response: QuizResponse = {
          question: question.question,
          options: question.options
        };

        return res.json(response);
      } 
      
      if (phase === "feedback") {
        // Save final quiz result to database
        try {
          const answers = await storage.getQuizAnalyticsBySession(sessionId);
          const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
          
          // Determine level based on score
          let nivel = "A1";
          if (score >= 31) nivel = "B2";
          else if (score >= 21) nivel = "B1";
          else if (score >= 11) nivel = "A2";

          // Generate detailed feedback based on level
          let feedbackContent = "";
          
          if (nivel === "A1") {
            feedbackContent = `1. Reforce o uso de artigos (der/die/das, ein), Negação (nicht, kein), Präsens de sein/haben, Ordem S‑V‑O, Ja‑Nein‑Fragen e W‑Fragen.
2. Pratique vocabulário básico em contextos do dia a dia (saudações, apresentações).
3. Ouvir diálogos simples (Podcast Destravando seu Alemão), shadowing de frases básicas, memorizar 20 palavras novas/semana.`;
          } else if (nivel === "A2") {
            feedbackContent = `1. Domine as diferenças entre Perfekt e Präteritum em narrativas cotidianas.
2. Casos acusativo vs. dativo, Perfekt (haben/sein + Partizip II), Verbos modais, Conjunções (und, aber, weil, dass), Imperativo.
3. Aprofunde o uso de conectores (zuerst, dann, danach), preposições de lugar e tempo em frases complexas.
4. Assistir séries infantis em alemão, role‑plays (comprar, combinar horários), mapas mentais de verbos e 10 expressões/dia.`;
          } else if (nivel === "B1") {
            feedbackContent = `1. Trabalhe Konjunktiv II para hipóteses e pedidos polidos.
2. Pratique orações subordinadas com „weil", „obwohl" e „als ob".
3. Pronomes relativos, Präteritum de sein/haben/gehen, Declinação de adjetivos.
4. Ouvir podcasts "Slow German", gravar áudios descrevendo o dia, anotar e usar 5 collocations/dia.`;
          } else { // B2
            feedbackContent = `1. Aplique Voz passiva e Modalpassiv, Partizipialkonstruktionen, Genitivo (wegen, trotz, während), Conjunções correlativas, Inversões estilísticas.
2. Expanda seu repertório com textos literários ou técnicos, participar de debates ou mini‑apresentações de 5 min, aprender 10 sinônimos/semana.`;
          }

          const feedbackTemplate = `Você acertou ${score} de 40 e seu nível estimado é **${nivel}**. Parabéns pelo resultado!

Para consolidar o que você já sabe e destravar de vez sua fala em alemão, aqui vão suas próximas etapas de estudo para o nível **${nivel}**:

${feedbackContent}

Quer ir além com material completo, cronograma claro e acompanhamento diário no seu aprendizado? Entre no meu WhatsApp e garante uma condição especial para o Curso Completo de Alemão da Ovídio Academy:
https://wa.me/message/B7UCVV3XCPANK1

—
Estou te aguardando lá para te ajudar a alcançar fluência com metodologia acelerada e acompanhamento personalizado! 🎯🇩🇪`;

          const prompt = `Baseado no seguinte template de feedback, gere uma versão personalizada e motivadora em português brasileiro:

${feedbackTemplate}

Mantenha a estrutura, mas torne o texto mais natural e envolvente, mantendo todas as informações técnicas e links.`;

          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.7
          });

          const feedback = aiResponse.choices[0].message.content || feedbackTemplate;

          // Save quiz result to database
          await storage.saveQuizResult({
            sessionId: sessionId,
            score: score,
            level: nivel,
            feedback: feedback,
            answers: answers,
            ipAddress: ipAddress,
          });

          const response: QuizResponse = {
            feedback
          };

          return res.json(response);
        } catch (openaiError) {
          console.error("OpenAI Error:", openaiError);
          
          // Fallback feedback if OpenAI fails - use same detailed format
          let nivel = "A1";
          if (score >= 31) nivel = "B2";
          else if (score >= 21) nivel = "B1";
          else if (score >= 11) nivel = "A2";

          let feedbackContent = "";
          
          if (nivel === "A1") {
            feedbackContent = `1. Reforce o uso de artigos (der/die/das, ein), Negação (nicht, kein), Präsens de sein/haben, Ordem S‑V‑O, Ja‑Nein‑Fragen e W‑Fragen.
2. Pratique vocabulário básico em contextos do dia a dia (saudações, apresentações).
3. Ouvir diálogos simples (Podcast Destravando seu Alemão), shadowing de frases básicas, memorizar 20 palavras novas/semana.`;
          } else if (nivel === "A2") {
            feedbackContent = `1. Domine as diferenças entre Perfekt e Präteritum em narrativas cotidianas.
2. Casos acusativo vs. dativo, Perfekt (haben/sein + Partizip II), Verbos modais, Conjunções (und, aber, weil, dass), Imperativo.
3. Aprofunde o uso de conectores (zuerst, dann, danach), preposições de lugar e tempo em frases complexas.
4. Assistir séries infantis em alemão, role‑plays (comprar, combinar horários), mapas mentais de verbos e 10 expressões/dia.`;
          } else if (nivel === "B1") {
            feedbackContent = `1. Trabalhe Konjunktiv II para hipóteses e pedidos polidos.
2. Pratique orações subordinadas com „weil", „obwohl" e „als ob".
3. Pronomes relativos, Präteritum de sein/haben/gehen, Declinação de adjetivos.
4. Ouvir podcasts "Slow German", gravar áudios descrevendo o dia, anotar e usar 5 collocations/dia.`;
          } else { // B2
            feedbackContent = `1. Aplique Voz passiva e Modalpassiv, Partizipialkonstruktionen, Genitivo (wegen, trotz, während), Conjunções correlativas, Inversões estilísticas.
2. Expanda seu repertório com textos literários ou técnicos, participar de debates ou mini‑apresentações de 5 min, aprender 10 sinônimos/semana.`;
          }

          const fallbackFeedback = `Você acertou ${score} de 40 e seu nível estimado é **${nivel}**. Parabéns pelo resultado!

Para consolidar o que você já sabe e destravar de vez sua fala em alemão, aqui vão suas próximas etapas de estudo para o nível **${nivel}**:

${feedbackContent}

Quer ir além com material completo, cronograma claro e acompanhamento diário no seu aprendizado? Entre no meu WhatsApp e garante uma condição especial para o Curso Completo de Alemão da Ovídio Academy:
https://wa.me/message/B7UCVV3XCPANK1

—
Estou te aguardando lá para te ajudar a alcançar fluência com metodologia acelerada e acompanhamento personalizado! 🎯🇩🇪`;

          // Save quiz result to database (fallback case)
          try {
            const answers = await storage.getQuizAnalyticsBySession(sessionId);
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            
            await storage.saveQuizResult({
              sessionId: sessionId,
              score: score,
              level: nivel,
              feedback: fallbackFeedback,
              answers: answers,
              ipAddress: ipAddress,
            });
          } catch (dbError) {
            console.error("Error saving fallback result:", dbError);
          }

          const response: QuizResponse = {
            feedback: fallbackFeedback
          };

          return res.json(response);
        }
      }

      return res.status(400).json({ error: "Invalid phase" });
    } catch (error) {
      console.error("Quiz API Error:", error);
      return res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Admin route to view quiz statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const results = await storage.getQuizResultsBySession(""); // Get all results
      const analytics = await storage.getQuizAnalyticsBySession(""); // Get all analytics
      
      res.json({
        totalQuizzes: results.length,
        results: results.slice(0, 50), // Limit to recent 50
        analytics: analytics.slice(0, 100), // Limit to recent 100
        levelDistribution: {
          A1: results.filter(r => r.level === "A1").length,
          A2: results.filter(r => r.level === "A2").length,
          B1: results.filter(r => r.level === "B1").length,
          B2: results.filter(r => r.level === "B2").length,
        }
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
