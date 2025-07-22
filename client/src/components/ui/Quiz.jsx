import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Quiz() {
  const totalQuestions = 40;

  const [phase, setPhase] = useState("quiz");        // "quiz" ou "feedback"
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState("");
  const [options,  setOptions]  = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [feedback, setFeedback]   = useState("");

  // Carrega a primeira pergunta
  useEffect(() => {
    loadQuestion(0);
  }, []);

  function loadQuestion(idx) {
    axios.post("/api/quiz", {
      phase: "quiz",
      questionIndex: idx,
      sessionId: sessionId || undefined
    })
    .then(({ data }) => {
      setQuestion(data.question);
      setOptions(data.options);
      if (data.sessionId) setSessionId(data.sessionId);
      setQuestionIndex(idx);
    })
    .catch(console.error);
  }

  function handleAnswer(choice) {
    const next = questionIndex + 1;

    if (next < totalQuestions) {
      // envia answer e carrega próxima pergunta
      axios.post("/api/quiz", {
        phase:         "quiz",
        questionIndex: next,
        answer:        choice,
        sessionId
      })
      .then(({ data }) => {
        setQuestion(data.question);
        setOptions(data.options);
        setQuestionIndex(next);
      })
      .catch(console.error);
    } else {
      // última pergunta → solicita feedback
      axios.post("/api/quiz", {
        phase:     "feedback",
        sessionId
      })
      .then(({ data }) => {
        setFeedback(data.feedback);
        setPhase("feedback");
      })
      .catch(console.error);
    }
  }

  if (phase === "feedback") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Resultado do Quiz</h2>
        <div dangerouslySetInnerHTML={{ __html: feedback }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Pergunta {questionIndex + 1} de {totalQuestions}</h3>
      <p><strong>{question}</strong></p>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => handleAnswer(["A","B","C"][i])}
          style={{ display: "block", margin: "8px 0" }}
        >
          {["A","B","C"][i]}. {opt}
        </button>
      ))}
    </div>
  );
}
