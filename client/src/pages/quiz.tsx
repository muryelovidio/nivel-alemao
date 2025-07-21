import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { QuizRequest, QuizResponse } from '@shared/schema';

interface QuizState {
  currentQuestionIndex: number;
  score: number;
  started: boolean;
  completed: boolean;
  currentQuestion?: string;
  currentOptions?: string[];
  selectedAnswer?: string;
  showUserResponse: boolean;
  isLoading: boolean;
  feedback?: string;
}

const levelConfigs = {
  'A1': { color: 'bg-green-500', name: 'A1' },
  'A2': { color: 'bg-blue-500', name: 'A2' },
  'B1': { color: 'bg-orange-500', name: 'B1' },
  'B2': { color: 'bg-red-500', name: 'B2' }
};

function getCurrentLevel(questionIndex: number): keyof typeof levelConfigs {
  if (questionIndex < 10) return 'A1';
  if (questionIndex < 20) return 'A2';
  if (questionIndex < 30) return 'B1';
  return 'B2';
}

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    started: false,
    completed: false,
    showUserResponse: false,
    isLoading: false
  });

  const quizMutation = useMutation({
    mutationFn: async (data: QuizRequest) => {
      const response = await apiRequest('POST', '/api/quiz', data);
      return response.json() as Promise<QuizResponse>;
    }
  });

  const startQuiz = () => {
    setQuizState(prev => ({ ...prev, started: true }));
    loadNextQuestion();
  };

  const loadNextQuestion = async () => {
    if (quizState.currentQuestionIndex >= 40) {
      await generateFeedback();
      return;
    }

    setQuizState(prev => ({ ...prev, isLoading: true, showUserResponse: false }));

    try {
      const response = await quizMutation.mutateAsync({
        phase: 'quiz',
        questionIndex: quizState.currentQuestionIndex,
        score: quizState.score
      });

      setQuizState(prev => ({
        ...prev,
        currentQuestion: response.question,
        currentOptions: response.options,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading question:', error);
      setQuizState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const selectAnswer = async (selectedLetter: string, selectedText: string) => {
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: `${selectedLetter}) ${selectedText}`,
      showUserResponse: true
    }));

    // Simulate checking answer (in real app, this would come from backend)
    // For demo purposes, assume answer A is always correct for scoring
    const isCorrect = selectedLetter === 'A'; // This is just for demo
    
    if (isCorrect) {
      setQuizState(prev => ({ ...prev, score: prev.score + 1 }));
    }

    // Show loading and proceed to next question
    setTimeout(() => {
      setQuizState(prev => ({ 
        ...prev, 
        isLoading: true,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
      
      setTimeout(() => {
        loadNextQuestion();
      }, 1500);
    }, 1000);
  };

  const generateFeedback = async () => {
    setQuizState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await quizMutation.mutateAsync({
        phase: 'feedback',
        questionIndex: 39,
        score: quizState.score
      });

      setQuizState(prev => ({
        ...prev,
        completed: true,
        feedback: response.feedback,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error generating feedback:', error);
      setQuizState(prev => ({
        ...prev,
        completed: true,
        feedback: `Com base no seu resultado de ${prev.score}/40 questões corretas, continue praticando! Agende uma aula: https://calendly.com/seulink`,
        isLoading: false
      }));
    }
  };

  const retakeTest = () => {
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      started: false,
      completed: false,
      showUserResponse: false,
      isLoading: false
    });
  };

  const currentLevel = getCurrentLevel(quizState.currentQuestionIndex);
  const progressPercentage = (quizState.currentQuestionIndex / 40) * 100;

  if (!quizState.started) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Ovídio Academy</h1>
                  <p className="text-sm text-gray-600">Teste de Nivelamento de Alemão</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-red-600">🇩🇪</span>
                <span>Alemão • CEFR A1-B2</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Welcome Message */}
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <Card className="max-w-md">
                <CardContent className="p-4">
                  <p className="text-gray-800 leading-relaxed">
                    <strong>Guten Tag!</strong> 👋<br /><br />
                    Bem-vindo ao teste de nivelamento de alemão da Ovídio Academy! 
                    Este teste avaliará seu conhecimento atual do idioma alemão através de 40 questões progressivas.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Test Information */}
            <Card className="mx-auto max-w-2xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center space-x-1 mb-4">
                    <div className="w-8 h-6 bg-black rounded-sm"></div>
                    <div className="w-8 h-6 bg-red-600 rounded-sm"></div>
                    <div className="w-8 h-6 bg-yellow-400 rounded-sm"></div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900">Teste de Nivelamento CEFR</h2>
                  <p className="text-gray-600">Descubra seu nível atual de alemão</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-clock text-green-600 text-lg"></i>
                      </div>
                      <p className="text-sm font-medium text-gray-900">15-20 min</p>
                      <p className="text-xs text-gray-600">Duração</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-question-circle text-blue-600 text-lg"></i>
                      </div>
                      <p className="text-sm font-medium text-gray-900">40 questões</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-layer-group text-purple-600 text-lg"></i>
                      </div>
                      <p className="text-sm font-medium text-gray-900">A1 - B2</p>
                      <p className="text-xs text-gray-600">Níveis CEFR</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-brain text-orange-600 text-lg"></i>
                      </div>
                      <p className="text-sm font-medium text-gray-900">IA</p>
                      <p className="text-xs text-gray-600">Feedback</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900 mb-3">Estrutura do Teste:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-semibold text-green-600">A1</div>
                        <div className="text-xs text-gray-600">10 questões</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-semibold text-blue-600">A2</div>
                        <div className="text-xs text-gray-600">10 questões</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-semibold text-orange-600">B1</div>
                        <div className="text-xs text-gray-600">10 questões</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-semibold text-red-600">B2</div>
                        <div className="text-xs text-gray-600">10 questões</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <i className="fas fa-play mr-3"></i>
                Iniciar Teste de Nivelamento
              </Button>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-white"></i>
                </div>
                <span className="font-bold text-gray-900">Ovídio Academy</span>
              </div>
              <p className="text-sm text-gray-600">
                Especialistas em ensino de alemão • Metodologia personalizada • Resultados comprovados
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (quizState.completed) {
    const finalLevel = quizState.score <= 10 ? 'A1' : 
                     quizState.score <= 20 ? 'A2' : 
                     quizState.score <= 30 ? 'B1' : 'B2';

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Ovídio Academy</h1>
                  <p className="text-sm text-gray-600">Teste de Nivelamento de Alemão</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Completion Celebration */}
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Parabéns!</h2>
              <p className="text-gray-600">Você completou o teste de nivelamento de alemão</p>
            </div>

            {/* Score Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center items-center space-x-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-600">{quizState.score}</div>
                      <div className="text-sm text-gray-600">de 40 questões</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{finalLevel}</div>
                      <div className="text-sm text-gray-600">Nível CEFR</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Feedback */}
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-brain text-white text-lg"></i>
              </div>
              <Card className="max-w-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <i className="fas fa-sparkles text-yellow-500"></i>
                    <span className="font-semibold text-gray-900">Seu Plano de Estudos Personalizado</span>
                  </div>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {quizState.feedback || 'Carregando feedback...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* WhatsApp CTA */}
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <i className="fab fa-whatsapp text-white text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Continue Sua Jornada no Alemão!</h3>
                  <p className="text-gray-700 max-w-md mx-auto">
                    Entre em contato via WhatsApp para uma condição especial no Curso Completo de Alemão da Ovídio Academy.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button 
                      onClick={() => window.open('https://wa.me/message/B7UCVV3XCPANK1', '_blank')}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <i className="fab fa-whatsapp mr-3 text-xl"></i>
                      Falar no WhatsApp Agora
                    </Button>
                    
                    <Button 
                      onClick={retakeTest}
                      variant="outline"
                      className="py-4 px-6 rounded-full border-gray-300 hover:border-gray-400"
                    >
                      <i className="fas fa-redo mr-2"></i>
                      Refazer Teste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ovídio Academy</h1>
                <p className="text-sm text-gray-600">Teste de Nivelamento de Alemão</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso do Teste</span>
            <span className="text-sm text-gray-600">{quizState.currentQuestionIndex} / 40</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>A1</span>
            <span>A2</span>
            <span>B1</span>
            <span>B2</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Current Level Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
              <div className={`w-3 h-3 ${levelConfigs[currentLevel].color} rounded-full`}></div>
              <span className="text-sm font-medium text-gray-700">Nível {currentLevel}</span>
            </div>
          </div>

          {/* Question */}
          {!quizState.isLoading && quizState.currentQuestion && (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <Card className="max-w-2xl">
                <CardContent className="p-4">
                  <p className="text-gray-800 leading-relaxed font-medium mb-4">
                    {quizState.currentQuestionIndex + 1}. {quizState.currentQuestion}
                  </p>
                  <div className="space-y-2">
                    {quizState.currentOptions?.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      return (
                        <Button
                          key={index}
                          onClick={() => selectAnswer(optionLetter, option)}
                          variant="outline"
                          className="w-full text-left p-3 h-auto justify-start hover:border-blue-600 hover:bg-blue-50"
                          disabled={quizState.showUserResponse}
                        >
                          <span className="font-medium text-blue-600 mr-3">{optionLetter})</span>
                          {option}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Response */}
          {quizState.showUserResponse && (
            <div className="flex justify-end">
              <div className="flex items-start space-x-3">
                <Card className="max-w-md bg-blue-50 border-blue-100">
                  <CardContent className="p-4">
                    <p className="text-gray-800 font-medium">
                      {quizState.selectedAnswer}
                    </p>
                  </CardContent>
                </Card>
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-user text-white text-lg"></i>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {quizState.isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-gray-600 text-sm">Preparando próxima pergunta...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
