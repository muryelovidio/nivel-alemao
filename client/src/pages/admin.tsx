import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

interface AdminStats {
  totalQuizzes: number;
  results: Array<{
    id: number;
    sessionId: string;
    score: number;
    level: string;
    completedAt: string;
    ipAddress?: string;
  }>;
  analytics: Array<{
    id: number;
    questionId: number;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: number;
    level: string;
    sessionId: string;
    answeredAt: string;
  }>;
  levelDistribution: {
    A1: number;
    A2: number;
    B1: number;
    B2: number;
  };
}

export default function AdminPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json() as Promise<AdminStats>;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar estatísticas</p>
        </div>
      </div>
    );
  }

  const totalAccuracy = stats?.analytics.length 
    ? (stats.analytics.filter(a => a.isCorrect === 1).length / stats.analytics.length * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-bar text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Estatísticas do Teste de Alemão</p>
              </div>
            </div>
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Voltar ao Teste
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Testes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <i className="fas fa-users text-gray-400"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.totalQuizzes || 0}</div>
            </CardContent>
          </Card>

          {/* Taxa de Acerto Geral */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
              <i className="fas fa-percentage text-gray-400"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalAccuracy}%</div>
            </CardContent>
          </Card>

          {/* Respostas Analisadas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Respostas</CardTitle>
              <i className="fas fa-question-circle text-gray-400"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.analytics.length || 0}</div>
            </CardContent>
          </Card>

          {/* Nível Mais Comum */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nível Mais Comum</CardTitle>
              <i className="fas fa-trophy text-gray-400"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.levelDistribution 
                  ? Object.entries(stats.levelDistribution)
                      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição por Níveis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribuição por Níveis CEFR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats?.levelDistribution && Object.entries(stats.levelDistribution).map(([level, count]) => (
                <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    level === 'A1' ? 'text-green-600' :
                    level === 'A2' ? 'text-blue-600' :
                    level === 'B1' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600">Nível {level}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resultados Recentes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Últimos Resultados (50 mais recentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Pontuação</th>
                    <th className="text-left py-2">Nível</th>
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs">{result.id}</td>
                      <td className="py-2">
                        <span className={`font-semibold ${
                          result.score >= 31 ? 'text-red-600' :
                          result.score >= 21 ? 'text-orange-600' :
                          result.score >= 11 ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {result.score}/40
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.level === 'A1' ? 'bg-green-100 text-green-800' :
                          result.level === 'A2' ? 'bg-blue-100 text-blue-800' :
                          result.level === 'B1' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.level}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">
                        {new Date(result.completedAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 font-mono text-xs text-gray-500">
                        {result.ipAddress?.substring(0, 12) || 'N/A'}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Análises de Respostas Recentes (100 mais recentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Questão</th>
                    <th className="text-left py-2">Nível</th>
                    <th className="text-left py-2">Resposta</th>
                    <th className="text-left py-2">Correta</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.analytics.slice(0, 50).map((analytics) => (
                    <tr key={analytics.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 font-bold">{analytics.questionId + 1}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analytics.level === 'A1' ? 'bg-green-100 text-green-800' :
                          analytics.level === 'A2' ? 'bg-blue-100 text-blue-800' :
                          analytics.level === 'B1' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analytics.level}
                        </span>
                      </td>
                      <td className="py-2 font-mono">{analytics.selectedAnswer}</td>
                      <td className="py-2 font-mono">{analytics.correctAnswer}</td>
                      <td className="py-2">
                        {analytics.isCorrect ? 
                          <span className="text-green-600 font-medium">✓ Correta</span> :
                          <span className="text-red-600 font-medium">✗ Incorreta</span>
                        }
                      </td>
                      <td className="py-2 text-gray-600 text-xs">
                        {new Date(analytics.answeredAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}