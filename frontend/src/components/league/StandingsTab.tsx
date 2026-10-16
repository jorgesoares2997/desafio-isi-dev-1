import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, MatchSummary, Standing } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';
import { ListOrdered, Plus, ArrowRight, RotateCw } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';
import { EmptyState, ServerOff } from '../common/EmptyState';

interface StandingsTabProps {
  clubs?: Club[];
  onOpenNewMatch: () => void;
  onNavigateToMatches: () => void;
  refreshTrigger?: number;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({
  clubs = [],
  onOpenNewMatch,
  onNavigateToMatches,
  refreshTrigger = 0,
}) => {
  const { showToast } = useToast();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Helper to find club acronym
  const getClubAcronym = (clubId: number, clubName: string) => {
    const found = clubs.find((c) => c.id === clubId);
    if (found?.acronym) return found.acronym;
    return clubName.slice(0, 3).toUpperCase();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [standingsRes, matchesRes] = await Promise.all([
        api.get<Standing[]>('/standings'),
        api.get<MatchSummary[]>('/matches'),
      ]);
      setStandings(standingsRes.data);
      setRecentMatches(matchesRes.data.slice(0, 3));
      setLoadError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setLoadError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const formatWithComma = (isoString: string) => {
    const raw = formatDateTime(isoString);
    if (!raw.includes(',')) {
      return raw.replace(' ', ', ');
    }
    return raw;
  };

  return (
    <div className="space-y-6">
      {/* Header da Página (Figma Screenshot 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-center text-[#155DFC] shrink-0">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Classificação
            </h1>
            <p className="text-xs text-[#686872] mt-0.5">
              Todos os clubes, com 3 pontos por vitória e 1 por empate.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewMatch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova partida
        </button>
      </div>

      {loadError && standings.length === 0 ? (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
          <EmptyState
            icon={ServerOff}
            title="Não foi possível carregar a classificação"
            description={loadError || 'Tente de novo. Se a API respondeu, mostre o message dela.'}
            action={{
              label: 'Tentar de novo',
              onClick: fetchData,
              icon: RotateCw,
            }}
            className="py-0 px-0"
          />
        </div>
      ) : standings.length === 0 && !loading ? (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
          <EmptyState
            icon={ListOrdered}
            title="Nenhum clube cadastrado"
            description="A classificação mostra todos os clubes, mesmo os que ainda não jogaram."
            className="py-0 px-0"
          />
        </div>
      ) : (
        <>
          {/* Grid com 2 Colunas (Tabela à esquerda ~65%, Painéis à direita ~35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna da Esquerda: Tabela de Classificação */}
            <div className="lg:col-span-8 bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] text-[#686872] font-semibold bg-white">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Clube</th>
                      <th className="py-3.5 px-3 text-center" title="Jogos Disputados">J</th>
                      <th className="py-3.5 px-3 text-center" title="Vitórias">V</th>
                      <th className="py-3.5 px-3 text-center" title="Empates">E</th>
                      <th className="py-3.5 px-3 text-center" title="Derrotas">D</th>
                      <th className="py-3.5 px-3 text-center" title="Gols Pró">GP</th>
                      <th className="py-3.5 px-3 text-center" title="Gols Contra">GC</th>
                      <th className="py-3.5 px-3 text-center" title="Saldo de Gols">SG</th>
                      <th className="py-3.5 px-4 text-center font-bold text-zinc-900" title="Pontos">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-3.5 px-4"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                          <td className="py-3.5 px-4"><Skeleton className="h-4 w-6 mx-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      standings.map((s) => {
                        const acr = getClubAcronym(s.club_id, s.club_name);
                        const sgDisplay =
                          s.goal_difference > 0
                            ? `+${s.goal_difference}`
                            : s.goal_difference;

                        return (
                          <tr key={s.club_id} className="hover:bg-zinc-50/50 transition">
                            {/* Posição: 1º tem badge azul, demais texto cinza */}
                            <td className="py-3.5 px-4 text-center">
                              {s.position === 1 ? (
                                <span className="w-5 h-5 rounded-md bg-[#155DFC] text-white font-bold text-xs flex items-center justify-center mx-auto shadow-2xs">
                                  1
                                </span>
                              ) : (
                                <span className="text-zinc-600 font-medium text-xs">
                                  {s.position}
                                </span>
                              )}
                            </td>

                            {/* Clube com Badge de Sigla */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                                  {acr}
                                </span>
                                <span className="font-semibold text-zinc-900">
                                  {s.club_name}
                                </span>
                              </div>
                            </td>

                            {/* Estatísticas */}
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.played}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.wins}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.draws}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.losses}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.goals_for}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {s.goals_against}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-700">
                              {sgDisplay}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-900 text-sm">
                              {s.points}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legenda de Abreviações (Figma Screenshot 5) */}
              <div className="px-6 py-3 border-t border-[#E4E4E7] bg-white text-[11px] text-[#686872]">
                J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
              </div>
            </div>

            {/* Coluna da Direita: Últimas Partidas e Critérios */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card: Últimas partidas */}
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-zinc-900">
                  Últimas partidas
                </h3>
                <p className="text-xs text-[#686872] mt-0.5">
                  Da mais recente para a mais antiga.
                </p>

                <div className="mt-3 divide-y divide-[#E4E4E7]">
                  {recentMatches.length === 0 ? (
                    <div className="py-4 text-xs text-[#686872]">
                      Nenhuma partida disputada ainda.
                    </div>
                  ) : (
                    recentMatches.map((m) => {
                      const isHomeWinner = m.home.goals > m.away.goals;
                      const isAwayWinner = m.away.goals > m.home.goals;

                      return (
                        <div key={m.id} className="py-3 first:pt-2 last:pb-1">
                          <div className="text-[11px] text-[#686872] font-mono">
                            {formatWithComma(m.played_at)}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1 text-xs">
                            <span className={`truncate flex-1 text-right ${isHomeWinner ? 'font-bold text-zinc-900' : 'text-zinc-700'}`}>
                              {m.home.club_name}
                            </span>
                            <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-900 font-bold font-mono rounded px-2 py-0.5 text-xs shrink-0">
                              {m.home.goals} × {m.away.goals}
                            </span>
                            <span className={`truncate flex-1 text-left ${isAwayWinner ? 'font-bold text-zinc-900' : 'text-zinc-700'}`}>
                              {m.away.club_name}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={onNavigateToMatches}
                  className="mt-3 pt-3 border-t border-[#E4E4E7] w-full text-left text-xs font-semibold text-[#155DFC] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todas as partidas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card: Ordem da tabela */}
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-zinc-900">
                  Ordem da tabela
                </h3>
                <p className="text-xs text-[#686872] mt-0.5 mb-3.5">
                  Critérios de classificação, nesta ordem.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-zinc-800">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>Mais pontos</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-800">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Maior saldo de gols</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-800">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>Mais gols marcados</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-800">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <span>Nome do clube, de A a Z</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota de Rodapé Explicativa (Figma Screenshot 5) */}
          <p className="text-xs text-[#686872] px-1">
            Classificação de 1 a 6, com os clubes sem partidas zerados. Pontos, saldo e posição são calculados a cada consulta, nunca gravados (RN21).
          </p>
        </>
      )}
    </div>
  );
};
