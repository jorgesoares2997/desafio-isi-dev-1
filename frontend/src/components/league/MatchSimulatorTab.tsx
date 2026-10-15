import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, MatchDetail, MatchSummary } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, getConditionBadgeClass, getPositionBadgeClass, formatConditionLabel } from '../../utils/formatters';
import { Swords, Trophy, Play, CheckCircle2, XCircle, RefreshCw, Calendar, ArrowRight } from 'lucide-react';

interface MatchSimulatorTabProps {
  onMatchPlayed?: () => void;
}

export const MatchSimulatorTab: React.FC<MatchSimulatorTabProps> = ({ onMatchPlayed }) => {
  const { addToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [homeClubId, setHomeClubId] = useState<number | null>(null);
  const [awayClubId, setAwayClubId] = useState<number | null>(null);

  const [loadingClubs, setLoadingClubs] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [recentMatches, setRecentMatches] = useState<MatchSummary[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);

  // Carregar lista de clubes e partidas recentes
  const fetchInitialData = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const [clubsRes, matchesRes] = await Promise.all([
        api.get<Club[]>('/clubs'),
        api.get<MatchSummary[]>('/matches'),
      ]);

      setClubs(clubsRes.data);
      setRecentMatches(matchesRes.data);

      if (clubsRes.data.length >= 2) {
        setHomeClubId(clubsRes.data[0].id);
        setAwayClubId(clubsRes.data[1].id);
      }
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setLoadingClubs(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSimulateMatch = async () => {
    if (!homeClubId || !awayClubId) {
      addToast('error', 'Selecione os dois clubes para o confronto.');
      return;
    }
    if (homeClubId === awayClubId) {
      addToast('error', 'Mandante e Visitante devem ser clubes diferentes.');
      return;
    }

    // Proteção contra duplo clique com flag de estado
    if (simulating) return;

    setSimulating(true);
    try {
      const res = await api.post<MatchDetail>('/matches', {
        home_club_id: homeClubId,
        away_club_id: awayClubId,
      });

      setSelectedMatch(res.data);
      addToast('success', `Partida finalizada! ${res.data.home.club_name} ${res.data.home.goals} x ${res.data.away.goals} ${res.data.away.club_name}`);

      // Atualizar lista de partidas
      const updatedMatches = await api.get<MatchSummary[]>('/matches');
      setRecentMatches(updatedMatches.data);

      // Notificar tab de classificação para atualizar a tabela
      if (onMatchPlayed) {
        onMatchPlayed();
      }
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setSimulating(false);
    }
  };

  const handleSelectRecentMatch = async (matchId: number) => {
    try {
      const res = await api.get<MatchDetail>(`/matches/${matchId}`);
      setSelectedMatch(res.data);
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    }
  };

  const getAttributeName = (attr: string) => {
    const map: Record<string, string> = {
      pace: 'Velocidade',
      shooting: 'Finalização',
      passing: 'Passe',
      dribbling: 'Drible',
      defending: 'Defesa',
      physical: 'Físico',
      agility: 'Agilidade',
    };
    return map[attr.toLowerCase()] || attr;
  };

  return (
    <div className="space-y-6">
      {/* Painel do Simulador de Partida */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-blue-400" />
          Simulador de Confrontos Oficiais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Clube Mandante */}
          <div className="md:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="block text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              Mandante (Casa)
            </span>
            <select
              value={homeClubId || ''}
              onChange={(e) => setHomeClubId(Number(e.target.value))}
              disabled={simulating || loadingClubs}
              className="w-full bg-zinc-900 border border-zinc-750 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === awayClubId}>
                  {c.name} ({c.acronym})
                </option>
              ))}
            </select>
          </div>

          {/* Versus e Botão de Ação */}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-extrabold text-zinc-500 tracking-widest font-mono">VS</span>
            <button
              onClick={handleSimulateMatch}
              disabled={simulating || !homeClubId || !awayClubId || homeClubId === awayClubId}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition active:scale-[0.98] ${
                simulating || !homeClubId || !awayClubId || homeClubId === awayClubId
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Jogar Partida
                </>
              )}
            </button>
          </div>

          {/* Clube Visitante */}
          <div className="md:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="block text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
              Visitante (Fora)
            </span>
            <select
              value={awayClubId || ''}
              onChange={(e) => setAwayClubId(Number(e.target.value))}
              disabled={simulating || loadingClubs}
              className="w-full bg-zinc-900 border border-zinc-750 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === homeClubId}>
                  {c.name} ({c.acronym})
                </option>
              ))}
            </select>
          </div>
        </div>

        {homeClubId === awayClubId && (
          <p className="text-xs text-rose-400 mt-3 text-center">
            Selecione clubes diferentes para o confronto.
          </p>
        )}
      </div>

      {/* Visualização de Partida Selecionada / Recém Disputada */}
      {selectedMatch && (
        <div className="space-y-6">
          {/* Card do Placar */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Mandante */}
              <div className="flex-1 text-center sm:text-right">
                <h4 className="text-xl font-bold text-zinc-100">{selectedMatch.home.club_name}</h4>
                <div className="text-xs font-mono text-zinc-400 mt-1">
                  Formação: <span className="text-blue-400 font-semibold">{selectedMatch.home.formation}</span>
                </div>
              </div>

              {/* Placar Central */}
              <div className="flex flex-col items-center justify-center px-6 py-2 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-4 text-4xl sm:text-5xl font-black font-mono">
                  <span className={selectedMatch.home.goals > selectedMatch.away.goals ? 'text-emerald-400' : 'text-zinc-200'}>
                    {selectedMatch.home.goals}
                  </span>
                  <span className="text-zinc-600">:</span>
                  <span className={selectedMatch.away.goals > selectedMatch.home.goals ? 'text-emerald-400' : 'text-zinc-200'}>
                    {selectedMatch.away.goals}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mt-1">
                  {selectedMatch.result}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  {formatDateTime(selectedMatch.played_at)}
                </span>
              </div>

              {/* Visitante */}
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xl font-bold text-zinc-100">{selectedMatch.away.club_name}</h4>
                <div className="text-xs font-mono text-zinc-400 mt-1">
                  Formação: <span className="text-rose-400 font-semibold">{selectedMatch.away.formation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhamento dos 6 Duelos Determinísticos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Detalhamento dos 6 Duelos Táticos Determinísticos (RN20)
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Mandante ataca em 1, 3, 5 · Visitante ataca em 2, 4, 6
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMatch.duels.map((duel) => {
                const isHomeAttacking = duel.attacking_club_id === selectedMatch.home.club_id;
                const attackingClubName = isHomeAttacking ? selectedMatch.home.club_name : selectedMatch.away.club_name;

                return (
                  <div
                    key={duel.order}
                    className={`p-4 rounded-xl border transition ${
                      duel.goal
                        ? 'bg-emerald-950/20 border-emerald-800/60 shadow-sm shadow-emerald-950/30'
                        : 'bg-zinc-950/60 border-zinc-800'
                    }`}
                  >
                    {/* Header do Duelo */}
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold font-mono flex items-center justify-center text-zinc-300">
                          {duel.order}º
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          Ataque: <strong className="text-zinc-200">{attackingClubName}</strong>
                        </span>
                      </div>
                      <div>
                        {duel.goal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-400 border border-emerald-700 animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5" /> GOL!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <XCircle className="w-3.5 h-3.5" /> DEFESA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Confronto Atacante vs Defensor */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Atacante */}
                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          Atacante
                        </span>
                        <div className="font-semibold text-zinc-200 truncate">
                          {duel.attacker.player_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`px-1 rounded text-[9px] font-bold ${getPositionBadgeClass(duel.attacker.position)}`}>
                            {duel.attacker.position}
                          </span>
                          <span className={`px-1 rounded text-[9px] border ${getConditionBadgeClass(duel.attacker.condition)}`}>
                            {formatConditionLabel(duel.attacker.condition)}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400">{getAttributeName(duel.attacker.attribute)}:</span>
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            {duel.attacker.value}
                          </span>
                        </div>
                      </div>

                      {/* Defensor */}
                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                          Defensor / Goleiro
                        </span>
                        <div className="font-semibold text-zinc-200 truncate">
                          {duel.defender.player_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`px-1 rounded text-[9px] font-bold ${getPositionBadgeClass(duel.defender.position)}`}>
                            {duel.defender.position}
                          </span>
                          <span className={`px-1 rounded text-[9px] border ${getConditionBadgeClass(duel.defender.condition)}`}>
                            {formatConditionLabel(duel.defender.condition)}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400">{getAttributeName(duel.defender.attribute)}:</span>
                          <span className="font-mono font-bold text-sm text-blue-400">
                            {duel.defender.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Histórico Recente de Partidas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          Histórico de Partidas Realizadas
        </h4>

        {recentMatches.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Nenhuma partida realizada ainda na liga.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectRecentMatch(m.id)}
                className="py-3 px-2 flex items-center justify-between hover:bg-zinc-800/40 rounded-lg cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    #{m.id}
                  </span>
                  <div className="flex items-center gap-2 font-medium text-zinc-200">
                    <span>{m.home.club_name}</span>
                    <span className="font-mono font-bold bg-zinc-800 px-2 py-0.5 rounded text-white">
                      {m.home.goals} x {m.away.goals}
                    </span>
                    <span>{m.away.club_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
                    {formatDateTime(m.played_at)}
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
                    Detalhes <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
