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
    <div className="relative w-full max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Moldura Principal com Fundo Tático */}
      <div className="relative bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden">
        
        {/* Marca d'água Tática: Campo de Futebol Oficial Figma ajustado para 1366px */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-70 z-0">
          <svg
            className="w-full h-full text-[#E4E4E7]"
            viewBox="0 0 1320 720"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Contorno externo do gramado com cantos arredondados */}
            <rect x="30" y="25" width="1260" height="670" rx="32" ry="32" />
            
            {/* Linha de Meio-Campo */}
            <line x1="660" y1="25" x2="660" y2="695" />
            
            {/* Círculo Central e Ponto Central */}
            <circle cx="660" cy="360" r="95" />
            <circle cx="660" cy="360" r="3.5" fill="currentColor" />

            {/* Lado Esquerdo: Área Grande, Área Pequena, Ponto Penal e Meia-Lua */}
            <rect x="30" y="180" width="190" height="360" />
            <rect x="30" y="270" width="75" height="180" />
            <circle cx="160" cy="360" r="3.5" fill="currentColor" />
            <path d="M 220 290 A 95 95 0 0 1 220 430" />
            {/* Gol Esquerdo Externo */}
            <rect x="12" y="305" width="18" height="110" rx="3" />

            {/* Lado Direito: Área Grande, Área Pequena, Ponto Penal e Meia-Lua */}
            <rect x="1100" y="180" width="190" height="360" />
            <rect x="1215" y="270" width="75" height="180" />
            <circle cx="1160" cy="360" r="3.5" fill="currentColor" />
            <path d="M 1100 290 A 95 95 0 0 0 1100 430" />
            {/* Gol Direito Externo */}
            <rect x="1290" y="305" width="18" height="110" rx="3" />
          </svg>
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          
          {/* Logo Oficial e Nome da Aplicação */}
          <div className="flex items-center gap-3.5 mb-5">
            <img 
              src="/logo.png" 
              alt="Passe Logo" 
              className="w-12 h-12 rounded-2xl object-contain shadow-md shadow-blue-500/20" 
            />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
              Passe
            </h1>
          </div>

          {/* Badge de Status da Liga com Líder / Partidas */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#E4E4E7] shadow-2xs mb-5 transition">
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
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-zinc-900 tracking-tight leading-tight sm:leading-tight mb-3">
            Gestão da liga, do mercado à classificação
          </h2>

          {/* Subheading / Descritivo */}
          <p className="text-sm sm:text-base text-[#686872] max-w-2xl mx-auto leading-relaxed mb-7">
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale os titulares e jogue partidas com placar calculado pelos atributos.
          </p>

          {/* Botão de Ação CTA + Atalho Enter */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-7">
            <button
              onClick={onStart}
              className="flex items-center justify-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white font-semibold text-sm sm:text-base px-8 py-3 rounded-xl shadow-md shadow-blue-500/25 transition cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs text-[#686872] mb-12">
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

          {/* 6 Cards Quadrados do Fluxo de Trabalho Conectados com Setas */}
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:items-center xl:justify-between gap-3 sm:gap-4 xl:gap-2 w-full">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.step}>
                    <button
                      onClick={step.action}
                      className="w-full xl:w-[174px] aspect-square text-left bg-white/95 backdrop-blur-xs border border-[#E4E4E7] hover:border-[#155DFC] hover:shadow-xs hover:bg-[#EFF6FF]/20 rounded-2xl p-4 transition flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className="w-5 h-5 text-[#155DFC] group-hover:scale-110 transition-transform" />
                        <span className="font-mono text-xs font-semibold text-[#686872]">
                          {step.step}
                        </span>
                      </div>
                      
                      <div className="my-auto">
                        <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-[#155DFC] transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-[#686872] mt-1.5 leading-snug">
                          {step.description}
                        </p>
                      </div>

                      <div className="h-1" />
                    </button>

                    {/* Seta divisória entre cards em telas grandes */}
                    {idx < steps.length - 1 && (
                      <div className="hidden xl:flex items-center justify-center text-zinc-400 select-none px-1">
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Rodapé Interno com Fuso de Brasília */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#686872] mt-8 pt-4 border-t border-[#E4E4E7]/60 w-full">
            <Clock className="w-3.5 h-3.5 text-[#686872]" />
            <span>Liga Fictícia 2026 · Horário de Brasília (UTC-3)</span>
          </div>

        </div>

      </div>
    </div>
  );
};
