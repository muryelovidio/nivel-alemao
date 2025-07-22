import { NextApiRequest, NextApiResponse } from 'next';
import { questions } from '../../server/routes'; // Caminho correto para o array

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phase, questionIndex, score } = req.body;

  if (phase === "quiz") {
    const question = questions[questionIndex];
    if (!question) {
      return res.status(404).json({ error: "Pergunta não encontrada" });
    }
    // Não envie a resposta correta para o frontend!
    return res.status(200).json({
      question: question.question,
      options: question.options,
      level: question.level
    });
  }

  if (phase === "feedback") {
    const total = questions.length;
    const nivel = score < 10 ? 'A1' : score < 20 ? 'A2' : score < 30 ? 'B1' : 'B2';
    const recomendacao = nivel === 'B2'
      ? 'Parabéns! Você atingiu o nível B2. Continue praticando para manter e aprimorar suas habilidades.'
      : 'Continue praticando e revise os materiais do nível correspondente ao seu resultado.';
    const feedback = `Seu resultado: ${score} de ${total}. Nível sugerido: ${nivel}. ${recomendacao}`;
    return res.status(200).json({ feedback });
  }

  return res.status(400).json({ error: 'Fase inválida' });
}