import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from './services/api';
import { 
  Activity, 
  Clock, 
  ShieldCheck, 
  Users, 
  Trophy, 
  ArrowLeftRight, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Terminal
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
}

export function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get<HealthData>('/health');
      setHealth(response.data);
      setLastAction(`Conexão com a API estabelecida com sucesso: ${response.data.status}`);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setApiError(msg);
      setLastAction(`Falha ao conectar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const testErrorHandling = async (type: 'bad-request' | 'not-found' | 'conflict') => {
    setLoading(true);
    setApiError(null);
    try {
      await api.get(`/health/test-error/${type}`);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setApiError(`[Interceptor extraiu a mensagem]: "${msg}"`);
      setLastAction(`Teste de erro HTTP disparado para '${type}'.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              P
            </div>
            <div>
              <span className="font-semibold tracking-tight text-lg text-white">Passe</span>
              <span className="ml-2 text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">v1.0 FASE 1</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-zinc-400 font-mono">
                API {health?.status === 'UP' ? 'Online' : 'Aguardando'}
              </span>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 px-3 py-1.5 rounded-md border border-zinc-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8 w-full">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" /> Desafio ISI DEV 1 · SENAI/PE
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Plataforma de Gestão de Mercado e Liga
              </h1>
              <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
                FASE 1 concluída: Orquestração Docker multi-serviços, schema relacional do PostgreSQL com Flyway, 
                API Spring Boot 3 no prefixo <code className="text-blue-400 font-mono bg-blue-950/50 px-1 py-0.5 rounded">/api/v1</code> com timezone de Brasília e tratamento centralizado de exceções.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Status do Servidor</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-mono">
                {health?.status || 'OFFLINE'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Prefixo base: <span className="font-mono text-zinc-400">/api/v1</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Horário de Brasília</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-white font-mono truncate">
                {health?.timestamp || 'Sincronizando...'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Formato: <span className="font-mono text-zinc-400">yyyy-MM-dd'T'HH:mm:ss-03:00</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Banco de Dados</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white font-mono">PostgreSQL 16</div>
              <div className="text-xs text-zinc-500 mt-1">
                Flyway: <span className="font-mono text-zinc-400">7 tabelas criadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Handling & Interceptor Validation */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Validação do Interceptor HTTP &amp; RestControllerAdvice</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Clique nos botões abaixo para disparar requisições para a API e verificar se o cliente Axios extrai estritamente a propriedade <code className="text-amber-400 font-mono">error.response.data.message</code> padronizada pelo backend:
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => testErrorHandling('bad-request')}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition"
            >
              Simular 400 (Bad Request)
            </button>
            <button
              onClick={() => testErrorHandling('not-found')}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition"
            >
              Simular 404 (Not Found)
            </button>
            <button
              onClick={() => testErrorHandling('conflict')}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 transition"
            >
              Simular 409 (Regra de Negócio)
            </button>
          </div>

          {/* Feedback Display */}
          {(apiError || lastAction) && (
            <div className="mt-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-3">
              {apiError ? (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-mono space-y-1">
                {apiError && <div className="text-amber-300 font-semibold">{apiError}</div>}
                {lastAction && <div className="text-zinc-500">{lastAction}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Modules Roadmap Grid */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Módulos da Aplicação (Estrutura Preparada)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">1. Jogadores</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Cadastro, overall dinâmico por posição, valor base e valor de mercado conforme regras RN02 a RN06.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">2. Clubes</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Caixa inicial de 300,00, unicidade de nome e sigla, limite de 20 clubes e 12 jogadores por elenco.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">3. Mercado &amp; Contratos</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Compra com fidelidade, teto de 50% do caixa, venda com multa regressiva e histórico com exportação CSV.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">4. Liga &amp; Partidas</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Escalação 5 titulares (1 GOL + 4 linha), 6 duelos determinísticos por atributos e tabela de classificação.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>Passe · Desafio Técnico SENAI/PE · Desenvolvedor Fullstack I (CÓD. 237)</p>
      </footer>
    </div>
  );
}

export default App;
