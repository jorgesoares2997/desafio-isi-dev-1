import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Standing } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Trophy, RefreshCw, Medal } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

interface StandingsTabProps {
  refreshTrigger?: number;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ refreshTrigger }) => {
  const { addToast } = useToast();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Standing[]>('/standings');
      setStandings(res.data);
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings, refreshTrigger]);

  const getPositionBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-amber-300">
          <Medal className="w-4 h-4 text-amber-400 fill-amber-400" /> 1º
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-zinc-300">
          <Medal className="w-4 h-4 text-zinc-300 fill-zinc-300" /> 2º
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
          <Medal className="w-4 h-4 text-amber-600 fill-amber-600" /> 3º
        </span>
      );
    }
    return <span className="font-mono text-zinc-400">{pos}º</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Tabela de Classificação Oficial (RN21)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Critérios de desempate: Pontos (V=3, E=1, D=0) &gt; Saldo de Gols &gt; Gols Pró &gt; Ordem Alfabética (NFD).
            </p>
          </div>

          <button
            onClick={fetchStandings}
            disabled={loading}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 px-3.5 py-2 rounded-lg border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            Atualizar Tabela
          </button>
        </div>

        {/* Tabela de Classificação com Overflow horizontal interno */}
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Pos</th>
                <th className="py-3 px-4">Clube</th>
                <th className="py-3 px-3 text-center" title="Jogos Disputados">J</th>
                <th className="py-3 px-3 text-center" title="Vitórias">V</th>
                <th className="py-3 px-3 text-center" title="Empates">E</th>
                <th className="py-3 px-3 text-center" title="Derrotas">D</th>
                <th className="py-3 px-3 text-center" title="Gols Pró">GP</th>
                <th className="py-3 px-3 text-center" title="Gols Contra">GC</th>
                <th className="py-3 px-3 text-center" title="Saldo de Gols">SG</th>
                <th className="py-3 px-4 text-center font-bold text-zinc-100" title="Pontos Ganhos">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500 text-xs">
                    Nenhum clube classificado ou dados não disponíveis.
                  </td>
                </tr>
              ) : (
                standings.map((s) => (
                  <tr
                    key={s.club_id}
                    className={`transition hover:bg-zinc-800/40 ${
                      s.position === 1 ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {getPositionBadge(s.position)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-100">
                      {s.club_name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300">
                      {s.played}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-semibold">
                      {s.wins}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-400">
                      {s.draws}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-400">
                      {s.losses}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300">
                      {s.goals_for}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300">
                      {s.goals_against}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">
                      <span className={s.goal_difference > 0 ? 'text-emerald-400' : s.goal_difference < 0 ? 'text-rose-400' : 'text-zinc-400'}>
                        {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-blue-400 text-base bg-zinc-950/30">
                      {s.points}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
