import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { QuizRequestSchema, type QuizQuestion, type QuizResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// German language quiz questions - 40 authentic questions organized by CEFR levels
const questions: QuizQuestion[] = [
  // A1 Level Questions (0-9)
  { id: 0, question: "Wie heißt du?", options: ["Ich bin müde", "Ich heiße Maria", "Ich komme später"], answer: "B", level: "A1" },
  { id: 1, question: "Wo wohnst du?", options: ["Ich wohne in Berlin", "Ich arbeite hier", "Ich spreche Deutsch"], answer: "A", level: "A1" },
  { id: 2, question: "Was ist das?", options: ["Das ist ein Buch", "Das sind müde", "Das hat Hunger"], answer: "A", level: "A1" },
  { id: 3, question: "Wie alt bist du?", options: ["Ich bin zwanzig Jahre alt", "Ich habe zwanzig", "Ich werde zwanzig"], answer: "A", level: "A1" },
  { id: 4, question: "Woher kommst du?", options: ["Ich gehe nach Deutschland", "Ich komme aus Brasilien", "Ich fahre nach Hause"], answer: "B", level: "A1" },
  { id: 5, question: "Was trinkst du gern?", options: ["Ich trinke gern Kaffee", "Ich esse gern Kaffee", "Ich schlafe gern Kaffee"], answer: "A", level: "A1" },
  { id: 6, question: "Wann stehst du auf?", options: ["Ich stehe um 7 Uhr auf", "Ich bin um 7 Uhr", "Ich gehe um 7 Uhr"], answer: "A", level: "A1" },
  { id: 7, question: "Welche Farbe hat das Auto?", options: ["Das Auto ist rot", "Das Auto hat rot", "Das Auto wird rot"], answer: "A", level: "A1" },
  { id: 8, question: "Wo ist der Schlüssel?", options: ["Der Schlüssel liegt auf dem Tisch", "Der Schlüssel ist müde", "Der Schlüssel trinkt Wasser"], answer: "A", level: "A1" },
  { id: 9, question: "Was kostet das Brot?", options: ["Das Brot kostet zwei Euro", "Das Brot ist zwei", "Das Brot hat zwei"], answer: "A", level: "A1" },

  // A2 Level Questions (10-19)
  { id: 10, question: "Was machst du beruflich?", options: ["Ich bin Lehrer", "Ich habe Hunger", "Ich gehe spazieren"], answer: "A", level: "A2" },
  { id: 11, question: "Wie ist das Wetter heute?", options: ["Das Wetter ist schön und sonnig", "Das Wetter trinkt Kaffee", "Das Wetter arbeitet viel"], answer: "A", level: "A2" },
  { id: 12, question: "Was hast du gestern gemacht?", options: ["Ich habe einen Film gesehen", "Ich sehe einen Film", "Ich werde einen Film sehen"], answer: "A", level: "A2" },
  { id: 13, question: "Warum lernst du Deutsch?", options: ["Weil ich in Deutschland arbeiten möchte", "Dass ich in Deutschland arbeite", "Wenn ich in Deutschland arbeite"], answer: "A", level: "A2" },
  { id: 14, question: "Kannst du mir helfen?", options: ["Ja, natürlich kann ich dir helfen", "Ja, ich helfe dir können", "Ja, du kannst mir helfen"], answer: "A", level: "A2" },
  { id: 15, question: "Wann fährt der nächste Zug?", options: ["Der nächste Zug fährt um 15:30", "Der nächste Zug ist um 15:30", "Der nächste Zug hat um 15:30"], answer: "A", level: "A2" },
  { id: 16, question: "Was für Musik hörst du gern?", options: ["Ich höre gern klassische Musik", "Ich esse gern klassische Musik", "Ich trinke gern klassische Musik"], answer: "A", level: "A2" },
  { id: 17, question: "Wie lange lernst du schon Deutsch?", options: ["Ich lerne seit zwei Jahren Deutsch", "Ich lerne vor zwei Jahren Deutsch", "Ich lerne in zwei Jahren Deutsch"], answer: "A", level: "A2" },
  { id: 18, question: "Was würdest du gern machen?", options: ["Ich würde gern reisen", "Ich will gern reisen", "Ich muss gern reisen"], answer: "A", level: "A2" },
  { id: 19, question: "Wo warst du letztes Wochenende?", options: ["Ich war bei meinen Freunden", "Ich bin bei meinen Freunden", "Ich werde bei meinen Freunden"], answer: "A", level: "A2" },

  // B1 Level Questions (20-29)
  { id: 20, question: "Wenn ich Zeit hätte, _____ ich mehr reisen.", options: ["werde", "würde", "will"], answer: "B", level: "B1" },
  { id: 21, question: "Das ist der Mann, _____ Auto gestohlen wurde.", options: ["dessen", "deren", "dem"], answer: "A", level: "B1" },
  { id: 22, question: "Obwohl es regnet, _____ wir spazieren.", options: ["gehen", "gingen", "gegangen"], answer: "A", level: "B1" },
  { id: 23, question: "Er tut so, _____ er alles wüsste.", options: ["als ob", "dass", "wenn"], answer: "A", level: "B1" },
  { id: 24, question: "Das Buch, _____ ich dir empfohlen habe, ist sehr interessant.", options: ["das", "den", "dem"], answer: "A", level: "B1" },
  { id: 25, question: "_____ des schlechten Wetters sind wir gegangen.", options: ["Wegen", "Trotz", "Während"], answer: "B", level: "B1" },
  { id: 26, question: "Sie arbeitet hart, _____ erfolgreich zu sein.", options: ["um", "damit", "dass"], answer: "A", level: "B1" },
  { id: 27, question: "Nachdem er _____ hatte, ging er schlafen.", options: ["gegessen", "essen", "isst"], answer: "A", level: "B1" },
  { id: 28, question: "Das Projekt _____ bis morgen fertig sein.", options: ["muss", "musste", "müsste"], answer: "A", level: "B1" },
  { id: 29, question: "Je mehr er lernt, _____ besser wird er.", options: ["desto", "als", "wie"], answer: "A", level: "B1" },

  // B2 Level Questions (30-39)
  { id: 30, question: "Der Politiker, _____ Rede gestern gehalten wurde, ist sehr umstritten.", options: ["dessen", "deren", "dem"], answer: "A", level: "B2" },
  { id: 31, question: "Hätte ich das gewusst, _____ ich anders gehandelt.", options: ["wäre", "hätte", "würde"], answer: "B", level: "B2" },
  { id: 32, question: "Das Unternehmen sieht sich _____ Kritik ausgesetzt.", options: ["schwerer", "schwere", "schwerer"], answer: "A", level: "B2" },
  { id: 33, question: "_____ allem Anschein nach wird es regnen.", options: ["Aller", "Allem", "Allen"], answer: "B", level: "B2" },
  { id: 34, question: "Die Angelegenheit _____ einer gründlichen Untersuchung.", options: ["bedarf", "braucht", "benötigt"], answer: "A", level: "B2" },
  { id: 35, question: "_____ seiner Bemühungen konnte er das Ziel nicht erreichen.", options: ["Trotz", "Ungeachtet", "Außer"], answer: "B", level: "B2" },
  { id: 36, question: "Das lässt sich _____ anders lösen.", options: ["kaum", "kein", "nicht"], answer: "A", level: "B2" },
  { id: 37, question: "Die Verhandlungen _____ sich über Wochen hin.", options: ["zogen", "zog", "gezogen"], answer: "A", level: "B2" },
  { id: 38, question: "_____ des Protestes wurde das Gesetz verabschiedet.", options: ["Trotz", "Außer", "Ungeachtet"], answer: "C", level: "B2" },
  { id: 39, question: "Der Sachverhalt _____ einer eingehenden Prüfung.", options: ["unterzieht", "unterziehen", "unterzogen"], answer: "A", level: "B2" }
];

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/quiz", async (req, res) => {
    try {
      const validatedData = QuizRequestSchema.parse(req.body);
      const { phase, questionIndex, answer, score } = validatedData;

      if (phase === "quiz") {
        // Return question data
        const question = questions[questionIndex];
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        const response: QuizResponse = {
          question: question.question,
          options: question.options
        };

        return res.json(response);
      } 
      
      if (phase === "feedback") {
        // Generate AI feedback using OpenAI
        try {
          const prompt = `Você é tutor de alemão. O aluno respondeu 40 perguntas e acertou ${score}.
Calcule o nível CEFR (0–10=A1; 11–20=A2; 21–30=B1; 31–40=B2).
Gere um parágrafo único com:
1. Nível estimado.
2. Dois pontos fortes.
3. Dois pontos a melhorar.
4. Convite para agendar aula: https://calendly.com/seulink

Responda em português brasileiro de forma motivadora e personalizada.`;

          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.7
          });

          const feedback = aiResponse.choices[0].message.content || "Feedback não disponível no momento.";

          const response: QuizResponse = {
            feedback
          };

          return res.json(response);
        } catch (openaiError) {
          console.error("OpenAI Error:", openaiError);
          
          // Fallback feedback if OpenAI fails
          let level = "A1";
          if (score >= 31) level = "B2";
          else if (score >= 21) level = "B1";
          else if (score >= 11) level = "A2";

          const fallbackFeedback = `Com base no seu resultado de ${score}/40 questões corretas, seu nível estimado é ${level}. Continue praticando para melhorar ainda mais! Agende uma aula personalizada: https://calendly.com/seulink`;

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

  const httpServer = createServer(app);
  return httpServer;
}
