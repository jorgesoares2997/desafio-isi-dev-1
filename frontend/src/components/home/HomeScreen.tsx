import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  Swords,
  CheckCircle2,
  ShoppingCart,
  Banknote,
  History,
  Trophy,
  Clock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Player, Club, Standing } from '../../types';

interface HomeScreenProps {
  onStart: () => void;
  onNavigate: (tab: 'players' | 'clubs' | 'league', clubId?: number) => void;
}

interface HomeStats {
  totalPlayers: number;
  freePlayers: number;
  totalClubs: number;
  totalMatches: number;
  leaderText: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, onNavigate }) => {
  const [stats, setStats] = useState<HomeStats>({
    totalPlayers: 23,
    freePlayers: 7,
    totalClubs: 6,
    totalMatches: 0,
    leaderText: 'nenhuma partida ainda',
  });
  const [loading, setLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      const [playersRes, clubsRes, standingsRes, matchesRes] = await Promise.allSettled([
        api.get<Player[]>('/players'),
        api.get<Club[]>('/clubs'),
        api.get<Standing[]>('/standings'),
        api.get<unknown[]>('/matches'),
      ]);

      let totalPlayers = 0;
      let freePlayers = 0;
      let totalClubs = 0;
      let totalMatches = 0;
      let leaderText = 'nenhuma partida ainda';

      if (playersRes.status === 'fulfilled' && Array.isArray(playersRes.value.data)) {
        totalPlayers = playersRes.value.data.length;
        freePlayers = playersRes.value.data.filter((p) => !p.club_id).length;
      }

      if (clubsRes.status === 'fulfilled' && Array.isArray(clubsRes.value.data)) {
        totalClubs = clubsRes.value.data.length;
      }

      if (matchesRes.status === 'fulfilled' && Array.isArray(matchesRes.value.data)) {
        totalMatches = matchesRes.value.data.length;
      }

      if (standingsRes.status === 'fulfilled' && Array.isArray(standingsRes.value.data) && standingsRes.value.data.length > 0) {
        const leader = standingsRes.value.data[0];
        if (leader.played > 0 || leader.points > 0) {
          leaderText = `líder: ${leader.club_name}, ${leader.points} ${leader.points === 1 ? 'ponto' : 'pontos'}`;
        }
      }

      setStats({
        totalPlayers,
        freePlayers,
        totalClubs,
        totalMatches,
        leaderText,
      });
    } catch {
      // Manter valores padrão em caso de instabilidade na API
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Listener para atalho de teclado 'Enter'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  const steps = [
    {
      step: '01',
      title: 'Jogadores',
      description: 'Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.',
      icon: Users,
      action: () => onNavigate('players'),
    },
    {
      step: '02',
      title: 'Clubes',
      description: 'Começam com 300,00 em caixa e sem jogadores.',
      icon: Shield,
      action: () => onNavigate('clubs'),
    },
    {
      step: '03',
      title: 'Compra',
      description: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
      icon: ShoppingCart,
      action: () => onNavigate('clubs'),
    },
    {
      step: '04',
      title: 'Venda',
      description: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
      icon: Banknote,
      action: () => onNavigate('clubs'),
    },
    {
      step: '05',
      title: 'Histórico',
      description: 'Toda compra e venda fica registrada, com totais e CSV.',
      icon: History,
      action: () => onNavigate('clubs'),
    },
    {
      step: '06',
      title: 'Liga',
      description: 'Escale 5 titulares e jogue partidas que entram na classificação.',
      icon: Trophy,
      action: () => onNavigate('league'),
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-x-hidden selection:bg-[#155DFC] selection:text-white">

      {/* Marca d'água Tática: Campo de Futebol Oficial Figma desenhado direto no fundo branco */}
      <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-75 z-0">
        <svg
          className="w-full max-w-[1280px] h-[660px] text-[#E4E4E7]"
          viewBox="0 0 1260 660"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Contorno do gramado com cantos arredondados */}
          <rect x="30" y="20" width="1200" height="620" rx="28" ry="28" />

          {/* Linha de Meio-Campo */}
          <line x1="630" y1="20" x2="630" y2="640" />

          {/* Círculo Central e Ponto Central */}
          <circle cx="630" cy="330" r="85" />
          <circle cx="630" cy="330" r="3.5" fill="currentColor" />

          {/* Lado Esquerdo: Área Grande, Área Pequena, Ponto Penal e Meia-Lua */}
          <rect x="30" y="150" width="170" height="360" />
          <rect x="30" y="240" width="65" height="180" />
          <circle cx="150" cy="330" r="3.5" fill="currentColor" />
          <path d="M 200 265 A 85 85 0 0 1 200 395" />
          {/* Gol Esquerdo Externo */}
          <rect x="14" y="275" width="16" height="110" rx="3" />

          {/* Lado Direito: Área Grande, Área Pequena, Ponto Penal e Meia-Lua */}
          <rect x="1060" y="150" width="170" height="360" />
          <rect x="1165" y="240" width="65" height="180" />
          <circle cx="1110" cy="330" r="3.5" fill="currentColor" />
          <path d="M 1060 265 A 85 85 0 0 0 1060 395" />
          {/* Gol Direito Externo */}
          <rect x="1230" y="275" width="16" height="110" rx="3" />
        </svg>
      </div>

      {/* Conteúdo Central Onboarding */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full">

        {/* Logo Oficial 56x56 e Nome Passe */}
        <div className="flex items-center gap-3.5 mb-4">
          <img
            src="/logo.png"
            alt="Passe Logo"
            className="w-[56px] h-[56px] rounded-2xl object-contain shadow-xs"
          />
          <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-zinc-900">
            Passe
          </h1>
        </div>

        {/* Badge de Status da Liga com Líder / Partidas */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E4E4E7] shadow-2xs mb-5 transition">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
          <span className="text-xs font-semibold text-zinc-900">
            Liga Fictícia 2026
          </span>
          <span className="text-xs text-[#686872]">·</span>
          <span className="text-xs text-[#686872]">
            {loading ? 'carregando liga...' : stats.leaderText}
          </span>
        </div>

        {/* Headline Principal */}
        <h2 className="text-3xl sm:text-4xl md:text-[38px] font-bold text-zinc-900 tracking-tight leading-tight sm:leading-tight mb-3 max-w-3xl">
          Gestão da liga, do mercado à classificação
        </h2>

        {/* Subheading / Descritivo */}
        <p className="text-sm sm:text-[15px] text-[#686872] max-w-[620px] mx-auto leading-relaxed mb-6">
          Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale os titulares e jogue partidas com placar calculado pelos atributos.
        </p>

        {/* Botão de Ação CTA + Atalho Enter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white font-medium text-sm sm:text-base px-7 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            Iniciar
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#686872]">
            <span>ou tecle</span>
            <kbd className="px-2 py-0.5 text-xs font-mono font-medium text-zinc-700 bg-[#F4F4F5] border border-[#E4E4E7] rounded-md shadow-2xs">
              Enter
            </kbd>
          </div>
        </div>

        {/* Métricas ao Vivo da Base de Dados */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs text-[#686872] mb-10">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#686872]" />
            <span>{stats.totalPlayers} jogadores</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#686872]" />
            <span>{stats.freePlayers} livres</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#686872]" />
            <span>{stats.totalClubs} clubes</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Swords className="w-3.5 h-3.5 text-[#686872]" />
            <span>{stats.totalMatches} partidas</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Não precisa de login</span>
          </div>
        </div>

        {/* 6 Cards RIGOROSAMENTE QUADRADOS - Linha única no Desktop (sem carrossel) e Grid no Mobile */}
        <div className="w-full">
          {/* Visualização Desktop: Linha contínua com 6 cards quadrados e 5 setas */}
          <div className="w-full max-w-[1140px] mx-auto hidden lg:flex items-center justify-between gap-1.5 xl:gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.step}>
                  <button
                    onClick={step.action}
                    className="flex-1 min-w-0 max-w-[164px] aspect-square text-left bg-white border border-[#E4E4E7] hover:border-[#155DFC] hover:shadow-xs hover:bg-[#EFF6FF]/20 rounded-2xl p-3.5 transition flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Topo do Card */}
                    <div className="flex items-center justify-between w-full">
                      <Icon className="w-4 h-4 text-[#155DFC] group-hover:scale-110 transition-transform" />
                      <span className="font-mono text-xs font-semibold text-[#686872]">
                        {step.step}
                      </span>
                    </div>

                    {/* Conteúdo Central do Card */}
                    <div className="flex flex-col justify-center my-auto">
                      <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-[#155DFC] transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-[#686872] mt-1 leading-[1.35]">
                        {step.description}
                      </p>
                    </div>

                    {/* Espaçador de Base para Rigor Geométrico */}
                    <div className="h-0.5" />
                  </button>

                  {/* Seta Divisória entre Cards */}
                  {idx < steps.length - 1 && (
                    <div className="flex items-center justify-center text-zinc-400 select-none px-0.5 shrink-0">
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Visualização Mobile / Tablet: Grid responsivo de cards quadrados (sem scroll horizontal/carrossel) */}
          <div className="w-full max-w-lg sm:max-w-xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 justify-items-center lg:hidden">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.step}
                  onClick={step.action}
                  className="w-full max-w-[164px] aspect-square text-left bg-white border border-[#E4E4E7] hover:border-[#155DFC] hover:shadow-xs hover:bg-[#EFF6FF]/20 rounded-2xl p-3.5 transition flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4 h-4 text-[#155DFC] group-hover:scale-110 transition-transform" />
                    <span className="font-mono text-xs font-semibold text-[#686872]">
                      {step.step}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center my-auto">
                    <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-[#155DFC] transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-[#686872] mt-1 leading-[1.35]">
                      {step.description}
                    </p>
                  </div>

                  <div className="h-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé Interno com Fuso de Brasília */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#686872] mt-8">
          <Clock className="w-3.5 h-3.5 text-[#686872]" />
          <span>Liga Fictícia 2026 · Horário de Brasília (UTC-3)</span>
        </div>

      </div>

    </div>
  );
};
