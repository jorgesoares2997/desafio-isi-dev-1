import React, { useState } from 'react';
import { Club, MatchDetail } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { ArrowLeft, CheckCircle2, X, Flame } from 'lucide-react';

interface MatchDetailViewProps {
  match: MatchDetail;
  clubs?: Club[];
  onBack: () => void;
  isJustPlayed?: boolean;
}

export const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  match,
  clubs = [],
  onBack,
  isJustPlayed = false,
}) => {
  const [showToast, setShowToast] = useState(isJustPlayed);

  // Helper to find club acronym
  const getClubAcronym = (clubId: number, clubName: string) => {
    const found = clubs.find((c) => c.id === clubId);
    if (found?.acronym) return found.acronym;
    return clubName.slice(0, 3).toUpperCase();
  };

  const homeAcronym = getClubAcronym(match.home.club_id, match.home.club_name);
  const awayAcronym = getClubAcronym(match.away.club_id, match.away.club_name);

  // Result label
  const getResultLabel = () => {
    if (match.home.goals > match.away.goals) return 'Vitória do mandante';
    if (match.away.goals > match.home.goals) return 'Vitória do visitante';
    return 'Empate';
  };

  // Format date with comma like "11/11/2026, 20:00"
  const formattedDate = () => {
    const raw = formatDateTime(match.played_at);
    if (!raw.includes(',')) {
      return raw.replace(' ', ', ');
    }
    return raw;
  };

  const getAttributeLabel = (attr: string) => {
    switch (attr.toLowerCase()) {
      case 'shooting':
        return 'Finalização';
      case 'passing':
        return 'Passe';
      case 'dribbling':
        return 'Drible';
      case 'defending':
        return 'Defesa';
      default:
        return attr;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Safe access to duels 1 to 6
  const duel1 = match.duels.find((d) => d.order === 1);
  const duel2 = match.duels.find((d) => d.order === 2);
  const duel3 = match.duels.find((d) => d.order === 3);
  const duel4 = match.duels.find((d) => d.order === 4);
  const duel5 = match.duels.find((d) => d.order === 5);
  const duel6 = match.duels.find((d) => d.order === 6);

  // Field players mapping
  // Mandante players:
  // Goleiro: duel4 defender
  // 1º linha: duel5 defender
  // 2º linha: duel3 attacker (and duel6 defender)
  // 3º linha: duel2 attacker
  // 4º linha: duel1 attacker
  const homeGoleiro = duel4?.defender;
  const homeL1 = duel5?.defender;
  const homeL2 = duel3?.attacker;
  const homeL2Def = duel6?.defender;
  const homeL3 = duel2?.attacker;
  const homeL4 = duel1?.attacker;

  // Visitante players:
  // Goleiro: duel1 defender
  // 1º linha: duel2 defender
  // 2º linha: duel6 attacker (and duel3 defender)
  // 3º linha: duel5 attacker
  // 4º linha: duel4 attacker
  const awayGoleiro = duel1?.defender;
  const awayL1 = duel2?.defender;
  const awayL2 = duel6?.attacker;
  const awayL2Def = duel3?.defender;
  const awayL3 = duel5?.attacker;
  const awayL4 = duel4?.attacker;

  const homeAttacks = match.duels.filter((d) => d.order <= 3);
  const awayAttacks = match.duels.filter((d) => d.order > 3);

  const homeGoalsCount = homeAttacks.filter((d) => d.goal).length;
  const awayGoalsCount = awayAttacks.filter((d) => d.goal).length;

  return (
    <div className="space-y-6">
      {/* Top Bar: Back Button + Floating Toast Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-[#155DFC] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para partidas
        </button>

        {showToast && (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-3 shadow-lg flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900">Partida jogada</p>
              <p className="text-[11px] text-[#686872] mt-0.5">
                {match.home.club_name} {match.home.goals} × {match.away.goals} {match.away.club_name}. Placar e duelos devolvidos pela API.
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-zinc-400 hover:text-zinc-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Placar Principal (Figma Screenshot 3) */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs flex items-center justify-between gap-4">
        {/* Mandante */}
        <div className="flex-1 text-right flex items-center justify-end gap-3">
          <div>
            <div className="flex items-center justify-end gap-2">
              <span className="font-bold text-base sm:text-lg text-zinc-900">
                {match.home.club_name}
              </span>
              <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-lg px-2 py-0.5 text-xs font-mono font-semibold">
                {homeAcronym}
              </span>
            </div>
            <p className="text-xs text-[#686872] mt-0.5">
              Mandante · {match.home.formation}
            </p>
          </div>
        </div>

        {/* Centro: Placar & Data & Resultado */}
        <div className="flex flex-col items-center justify-center shrink-0 px-4 sm:px-8">
          <div className="bg-zinc-100/80 border border-[#E4E4E7] rounded-xl px-5 py-1.5">
            <span className="font-bold text-2xl tracking-wider text-zinc-900 font-sans">
              {match.home.goals} × {match.away.goals}
            </span>
          </div>
          <span className="text-xs text-[#686872] font-mono mt-1.5">
            {formattedDate()}
          </span>
          <span className="mt-1 bg-zinc-50 border border-[#E4E4E7] text-zinc-600 rounded-full px-3 py-0.5 text-xs font-medium">
            {getResultLabel()}
          </span>
        </div>

        {/* Visitante */}
        <div className="flex-1 text-left flex items-center justify-start gap-3">
          <div>
            <div className="flex items-center justify-start gap-2">
              <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-lg px-2 py-0.5 text-xs font-mono font-semibold">
                {awayAcronym}
              </span>
              <span className="font-bold text-base sm:text-lg text-zinc-900">
                {match.away.club_name}
              </span>
            </div>
            <p className="text-xs text-[#686872] mt-0.5">
              Visitante · {match.away.formation}
            </p>
          </div>
        </div>
      </div>

      {/* Card Em Campo (Campo de Futebol Tático Determinístico) */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs">
        {/* Header do Card com Legenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Em campo</h3>
            <p className="text-xs text-[#686872] mt-0.5">
              Titulares de cada clube na formação da partida e os valores usados nos duelos, já com o efeito da condição.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#686872] self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[10px]">
                <Flame className="w-2.5 h-2.5 fill-current" />
              </span>
              <span>Mal condicionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>⚽</span>
              <span>Gol no duelo</span>
            </div>
          </div>
        </div>

        {/* Campo Visual */}
        <div className="relative w-full h-[380px] sm:h-[440px] bg-[#166534] rounded-2xl overflow-hidden shadow-inner border border-emerald-900 select-none">
          {/* Marcações do gramado */}
          <div className="absolute inset-4 border border-white/35 rounded-lg pointer-events-none" />
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-white/35 -translate-x-1/2 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/35 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50 pointer-events-none" />
          
          {/* Grande Área Esquerda */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-28 h-48 border border-l-0 border-white/35 pointer-events-none" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-24 border border-l-0 border-white/35 pointer-events-none" />

          {/* Grande Área Direita */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-48 border border-r-0 border-white/35 pointer-events-none" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-24 border border-r-0 border-white/35 pointer-events-none" />

          {/* Tags Superiores de Cada Time */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{match.home.club_name} {match.home.formation}</span>
            <span className="text-white/60">| ataca →</span>
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>{match.away.club_name} {match.away.formation}</span>
            <span className="text-white/60">| ataca ←</span>
          </div>

          {/* JOGADORES DO MANDANTE (LADO ESQUERDO) */}
          {/* Goleiro */}
          {homeGoleiro && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '8%', top: '50%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {getInitials(homeGoleiro.player_name)}
                </div>
                {homeGoleiro.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {homeGoleiro.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                GOL · Def {homeGoleiro.value}
              </span>
            </div>
          )}

          {/* 1º de linha (ZAG) */}
          {homeL1 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '22%', top: '28%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {getInitials(homeL1.player_name)}
                </div>
                {homeL1.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {homeL1.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {homeL1.position} · Def {homeL1.value}
              </span>
            </div>
          )}

          {/* 2º de linha (LAT) */}
          {homeL2 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '24%', top: '72%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {getInitials(homeL2.player_name)}
                </div>
                {homeL2.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel3?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {homeL2.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {homeL2.position} · Dri {homeL2.value} · Def {homeL2Def?.value ?? homeL2.value}
              </span>
            </div>
          )}

          {/* 3º de linha (MEI) */}
          {homeL3 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '37%', top: '52%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {getInitials(homeL3.player_name)}
                </div>
                {homeL3.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel2?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {homeL3.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {homeL3.position} · Pas {homeL3.value}
              </span>
            </div>
          )}

          {/* 4º de linha (ATA) */}
          {homeL4 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '46%', top: '44%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  {getInitials(homeL4.player_name)}
                </div>
                {homeL4.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel1?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {homeL4.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {homeL4.position} · Fin {homeL4.value}
              </span>
            </div>
          )}

          {/* JOGADORES DO VISITANTE (LADO DIREITO) */}
          {/* Goleiro */}
          {awayGoleiro && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '92%', top: '50%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-900 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 shadow-md">
                  {getInitials(awayGoleiro.player_name)}
                </div>
                {awayGoleiro.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {awayGoleiro.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                GOL · Def {awayGoleiro.value}
              </span>
            </div>
          )}

          {/* 1º de linha (ZAG) */}
          {awayL1 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '78%', top: '28%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-900 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 shadow-md">
                  {getInitials(awayL1.player_name)}
                </div>
                {awayL1.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {awayL1.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {awayL1.position} · Def {awayL1.value}
              </span>
            </div>
          )}

          {/* 2º de linha (LAT) */}
          {awayL2 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '76%', top: '72%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-900 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 shadow-md">
                  {getInitials(awayL2.player_name)}
                </div>
                {awayL2.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel6?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {awayL2.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {awayL2.position} · Dri {awayL2.value} · Def {awayL2Def?.value ?? awayL2.value}
              </span>
            </div>
          )}

          {/* 3º de linha (MEI) */}
          {awayL3 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '63%', top: '52%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-900 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 shadow-md">
                  {getInitials(awayL3.player_name)}
                </div>
                {awayL3.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel5?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {awayL3.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {awayL3.position} · Pas {awayL3.value}
              </span>
            </div>
          )}

          {/* 4º de linha (ATA) */}
          {awayL4 && (
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: '54%', top: '44%' }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-900 font-bold text-xs flex items-center justify-center border-2 border-zinc-900 shadow-md">
                  {getInitials(awayL4.player_name)}
                </div>
                {awayL4.condition === 'MAL_CONDICIONADO' && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}
                {duel4?.goal && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow">
                    ⚽
                  </span>
                )}
              </div>
              <span className="text-white text-[11px] font-semibold drop-shadow-md text-center mt-1 truncate max-w-[85px]">
                {awayL4.player_name}
              </span>
              <span className="text-white/80 text-[10px] font-mono drop-shadow">
                {awayL4.position} · Fin {awayL4.value}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Duelos (Tabela dos 6 Duelos Determinísticos) */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <h3 className="text-base font-bold text-zinc-900">Duelos</h3>
          <p className="text-xs text-[#686872] mt-0.5">
            Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de linha vão do 1º (o mais recuado) ao 4º (o mais avançado), pela ordem do elenco: o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
          </p>
        </div>

        {/* Tabela dos Duelos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-t border-b border-[#E4E4E7] text-[#686872] font-semibold bg-white">
                <th className="py-3 px-6 w-16">Duelo</th>
                <th className="py-3 px-6">Atacante</th>
                <th className="py-3 px-6">Ataque</th>
                <th className="py-3 px-6">Defensor</th>
                <th className="py-3 px-6">Defesa</th>
                <th className="py-3 px-6 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {/* Faixa Seção 1: Mandante */}
              <tr className="bg-[#FAFAFA]">
                <td colSpan={6} className="py-2.5 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-semibold">
                        {homeAcronym}
                      </span>
                      <span className="font-semibold text-zinc-900 text-xs">
                        Ataques do {match.home.club_name} (mandante)
                      </span>
                    </div>
                    <span className="text-xs text-[#686872] font-mono">
                      {homeGoalsCount} {homeGoalsCount === 1 ? 'gol' : 'gols'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Duelos 1, 2, 3 */}
              {homeAttacks.map((duel) => {
                const getAttackerRoleText = () => {
                  if (duel.order === 1) return `ATA, 4º de linha · ${match.home.club_name}`;
                  if (duel.order === 2) return `MEI, 3º de linha · ${match.home.club_name}`;
                  return `LAT, 2º de linha · ${match.home.club_name}`;
                };

                const getDefenderRoleText = () => {
                  if (duel.order === 1) return `Goleiro · ${match.away.club_name}`;
                  if (duel.order === 2) return `ZAG, 1º de linha · ${match.away.club_name}`;
                  return `LAT, 2º de linha · ${match.away.club_name}`;
                };

                return (
                  <tr key={duel.order} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-zinc-700">
                      {duel.order}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#155DFC] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {getInitials(duel.attacker.player_name)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {duel.attacker.player_name}
                          </div>
                          <div className="text-[11px] text-[#686872]">
                            {getAttackerRoleText()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[#686872]">{getAttributeLabel(duel.attacker.attribute)}</span>{' '}
                      <span className="font-bold text-zinc-900 font-mono ml-1">{duel.attacker.value}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white text-zinc-900 border border-[#E4E4E7] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {getInitials(duel.defender.player_name)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {duel.defender.player_name}
                          </div>
                          <div className="text-[11px] text-[#686872]">
                            {getDefenderRoleText()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[#686872]">Defesa</span>{' '}
                      <span className="font-bold text-zinc-900 font-mono ml-1">{duel.defender.value}</span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {duel.goal ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#016630] border border-[#B9F8CF]">
                          ⚽ Gol
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-white text-zinc-700 border border-[#E4E4E7]">
                          Sem gol
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Faixa Seção 2: Visitante */}
              <tr className="bg-[#FAFAFA]">
                <td colSpan={6} className="py-2.5 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-semibold">
                        {awayAcronym}
                      </span>
                      <span className="font-semibold text-zinc-900 text-xs">
                        Ataques do {match.away.club_name} (visitante)
                      </span>
                    </div>
                    <span className="text-xs text-[#686872] font-mono">
                      {awayGoalsCount} {awayGoalsCount === 1 ? 'gol' : 'gols'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Duelos 4, 5, 6 */}
              {awayAttacks.map((duel) => {
                const getAttackerRoleText = () => {
                  if (duel.order === 4) return `ATA, 4º de linha · ${match.away.club_name}`;
                  if (duel.order === 5) return `MEI, 3º de linha · ${match.away.club_name}`;
                  return `LAT, 2º de linha · ${match.away.club_name}`;
                };

                const getDefenderRoleText = () => {
                  if (duel.order === 4) return `Goleiro · ${match.home.club_name}`;
                  if (duel.order === 5) return `ZAG, 1º de linha · ${match.home.club_name}`;
                  return `LAT, 2º de linha · ${match.home.club_name}`;
                };

                return (
                  <tr key={duel.order} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-zinc-700">
                      {duel.order}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white text-zinc-900 border border-[#E4E4E7] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {getInitials(duel.attacker.player_name)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {duel.attacker.player_name}
                          </div>
                          <div className="text-[11px] text-[#686872]">
                            {getAttackerRoleText()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[#686872]">{getAttributeLabel(duel.attacker.attribute)}</span>{' '}
                      <span className="font-bold text-zinc-900 font-mono ml-1">{duel.attacker.value}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#155DFC] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {getInitials(duel.defender.player_name)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">
                            {duel.defender.player_name}
                          </div>
                          <div className="text-[11px] text-[#686872]">
                            {getDefenderRoleText()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[#686872]">Defesa</span>{' '}
                      <span className="font-bold text-zinc-900 font-mono ml-1">{duel.defender.value}</span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {duel.goal ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#016630] border border-[#B9F8CF]">
                          ⚽ Gol
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-white text-zinc-700 border border-[#E4E4E7]">
                          Sem gol
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota de rodapé (Screenshot 3) */}
      <p className="text-xs text-[#686872] px-1">
        Mesma tela logo depois de jogar e ao abrir uma partida do histórico, com as formações dos dois clubes e os 6 duelos. Os valores e a condição de cada titular vêm gravados nos duelos devolvidos pela API; mal condicionado joga com 15% a menos (RN20).
      </p>
    </div>
  );
};
